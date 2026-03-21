"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Search,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { adminNavConfig, type NavItem } from "@/lib/navigation/adminNavConfig";
import { FeatureGuard } from "../school/FeatureGuard";
import { PermissionGuard } from "../auth/PermissionGuard";

// --- Constants ---------------------------------------------------------------

const PRIMARY_EXPANDED = 210;
const PRIMARY_COLLAPSED = 60;
const SECONDARY_MIN = 200;
const SECONDARY_DEFAULT = 240;
const SECONDARY_MAX = 400;

// --- Components -------------------------------------------------------------

function NavGate({
  item,
  children,
}: {
  item: NavItem;
  children: (visible: boolean) => React.ReactNode;
}) {
  const content = children(true);

  if (item.feature) {
    return (
      <FeatureGuard feature={item.feature} fallback={children(false)}>
        {item.permission ? (
          <PermissionGuard
            permission={item.permission}
            requiresStaffProfile={item.requiresStaffProfile}
            fallback={children(false)}
          >
            {content}
          </PermissionGuard>
        ) : (
          content
        )}
      </FeatureGuard>
    );
  }

  if (item.permission) {
    return (
      <PermissionGuard
        permission={item.permission}
        requiresStaffProfile={item.requiresStaffProfile}
        fallback={children(false)}
      >
        {content}
      </PermissionGuard>
    );
  }

  return <>{content}</>;
}

// --- Primary Sidebar Item ---------------------------------------------------

function PrimaryItem({
  item,
  isActive,
  isSelected,
  isPrimaryCollapsed,
  onSelect,
}: {
  item: NavItem;
  isActive: boolean;
  isSelected: boolean;
  isPrimaryCollapsed: boolean;
  onSelect: (item: NavItem) => void;
}) {
  const hasChildren = Boolean(item.children?.length);

  const baseClass = cn(
    "group relative flex items-center gap-2.5 rounded-md transition-colors duration-100",
    isPrimaryCollapsed ? "h-9 w-9 justify-center" : "px-3 py-[7px] w-full",
    isSelected
      ? "bg-accent-bg text-accent"
      : isActive
        ? "text-text-primary font-medium"
        : "text-text-primary hover:bg-surface-hover",
  );

  const content = (
    <>
      <item.icon size={15} className="shrink-0" aria-hidden="true" />
      {!isPrimaryCollapsed ? (
        <div className="flex flex-1 items-center justify-between overflow-hidden">
          <span className="truncate text-[13px]">{item.label}</span>
          {hasChildren && (
            <ChevronRight
              size={12}
              className={cn(
                "ml-auto text-text-secondary transition-transform duration-200 group-hover:text-text-primary",
                isSelected && "rotate-90 text-accent",
              )}
            />
          )}
        </div>
      ) : (
        hasChildren && (
          <div
            className={cn(
              "absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-text-tertiary/40",
              isSelected && "bg-accent",
            )}
          />
        )
      )}
    </>
  );

  if (hasChildren) {
    return (
      <NavGate item={item}>
        {(visible) =>
          visible ? (
            <button
              type="button"
              title={isPrimaryCollapsed ? item.label : undefined}
              aria-label={item.label}
              aria-pressed={isSelected}
              onClick={() => onSelect(item)}
              className={baseClass}
            >
              {content}
            </button>
          ) : null
        }
      </NavGate>
    );
  }

  return (
    <NavGate item={item}>
      {(visible) =>
        visible ? (
          <Link
            href={item.href}
            title={isPrimaryCollapsed ? item.label : undefined}
            aria-label={item.label}
            onClick={() => onSelect(item)}
            className={baseClass}
          >
            {content}
          </Link>
        ) : null
      }
    </NavGate>
  );
}

// --- Secondary list item ---------------------------------------------------

function SecondaryItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <NavGate item={item}>
      {(visible) =>
        visible ? (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-md px-3 py-[7px]",
              "text-[13px] transition-colors duration-100 truncate",
              isActive
                ? "bg-accent-bg text-accent font-medium"
                : "text-text-primary hover:bg-surface-hover",
            )}
          >
            <span className="truncate">{item.label}</span>
          </Link>
        ) : null
      }
    </NavGate>
  );
}

// --- Main Layout Component --------------------------------------------------

export function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);
  const [selectedHref, setSelectedHref] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isTabbed, setIsTabbed] = useState(false);
  const [secondaryWidth, setSecondaryWidth] = useState(SECONDARY_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);

  // Resize logic
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isResizing) return;
      const newWidth =
        e.clientX - (isPrimaryCollapsed ? PRIMARY_COLLAPSED : PRIMARY_EXPANDED);
      if (newWidth < 50) {
        setIsTabbed(true);
      } else {
        setIsTabbed(false);
        setSecondaryWidth(
          Math.min(SECONDARY_MAX, Math.max(SECONDARY_MIN, newWidth)),
        );
      }
    },
    [isResizing, isPrimaryCollapsed],
  );

  const onPointerUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    } else {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isResizing, onPointerMove, onPointerUp]);

  const handleSectionChange = useCallback((nextHref: string | null) => {
    setSelectedHref(nextHref);
    setSearch("");
  }, []);

  const selectedItem = useMemo(
    () => adminNavConfig.find((i) => i.href === selectedHref) ?? null,
    [selectedHref],
  );

  const hasSecondary = Boolean(selectedItem?.children?.length);

  const filteredChildren = useMemo(() => {
    const kids = selectedItem?.children ?? [];
    if (!search.trim()) return kids;
    const q = search.toLowerCase();
    return kids.filter((c) => c.label.toLowerCase().includes(q));
  }, [selectedItem, search]);

  const handleSelect = useCallback(
    (item: NavItem) => {
      if (!item.children?.length) {
        handleSectionChange(null);
        onClose();
        return;
      }

      if (selectedHref === item.href) {
        if (isTabbed) {
          setIsTabbed(false);
          setSecondaryWidth(SECONDARY_DEFAULT);
        } else {
          handleSectionChange(null);
        }
      } else {
        handleSectionChange(item.href);
        setIsTabbed(false);
        if (secondaryWidth < SECONDARY_MIN)
          setSecondaryWidth(SECONDARY_DEFAULT);
      }
    },
    [selectedHref, isTabbed, secondaryWidth, handleSectionChange, onClose],
  );

  const primaryWidth = isPrimaryCollapsed
    ? PRIMARY_COLLAPSED
    : PRIMARY_EXPANDED;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex border-r border-border-panel bg-surface transition-transform lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* PRIMARY SIDEBAR */}
        <div
          style={{ width: primaryWidth }}
          className="relative z-10 flex h-full flex-col bg-surface shadow-[5px_0_15px_-5px_rgba(0,0,0,0.08)] transition-[width] duration-300 ease-in-out"
        >
          {/* Logo / Title area if needed, or stick to Topbar logo */}

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden p-2">
            {adminNavConfig.map((item) => (
              <PrimaryItem
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
                isSelected={selectedHref === item.href}
                isPrimaryCollapsed={isPrimaryCollapsed}
                onSelect={handleSelect}
              />
            ))}
          </nav>

          {/* Bottom actions (Collapse Toggle) */}
          <div className="border-t border-border-inner p-2">
            <button
              onClick={() => setIsPrimaryCollapsed(!isPrimaryCollapsed)}
              className="flex h-9 w-full items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={
                isPrimaryCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
            >
              {isPrimaryCollapsed ? (
                <ChevronsRight size={16} />
              ) : (
                <>
                  <ChevronsLeft size={16} className="mr-2" />
                  <span className="text-[12px] font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECONDARY SIDEBAR */}
        <div
          style={{
            width: !hasSecondary ? 0 : isTabbed ? 28 : secondaryWidth,
            borderLeftWidth: hasSecondary ? 1 : 0,
          }}
          className="relative overflow-hidden bg-surface transition-[width] duration-300 ease-in-out border-border-inner"
        >
          <div
            style={{ width: isTabbed ? 28 : secondaryWidth }}
            className="h-full"
          >
            {isTabbed ? (
              <button
                onClick={() => {
                  setIsTabbed(false);
                  handleSectionChange(null);
                  setSecondaryWidth(SECONDARY_DEFAULT);
                }}
                className="flex w-[28px] shrink-0 flex-col items-center justify-center bg-surface hover:bg-surface-subtle cursor-pointer border-l border-border-inner"
              >
                <span
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                  className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary"
                >
                  {selectedItem?.label}
                </span>
              </button>
            ) : (
              <div
                className="flex flex-col overflow-hidden h-full"
                style={{ width: secondaryWidth }}
              >
                <div className="relative flex flex-1 flex-col">
                  {/* Pane Header */}
                  <div className="shrink-0 px-4 pt-5 pb-3">
                    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">
                      {selectedItem?.label}
                    </p>
                    <div className="relative group">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-accent"
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${selectedItem?.label.toLowerCase()}...`}
                        className="w-full rounded-md border border-border-inner/60 bg-white/40 py-1.5 pl-8 pr-3 text-[12px] transition-all focus:bg-white focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/5"
                      />
                    </div>
                  </div>

                  {/* Sub Nav Items */}
                  <nav className="flex-1 overflow-y-auto px-2">
                    <div className="flex flex-col gap-0.5">
                      {filteredChildren.map((child) => (
                        <SecondaryItem
                          key={child.href}
                          item={child}
                          pathname={pathname}
                          onNavigate={onClose}
                        />
                      ))}
                    </div>
                  </nav>
                </div>
              </div>
            )}

            {!isTabbed && (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="group absolute inset-y-0 right-0 w-[6px] cursor-col-resize hover:bg-accent/5 transition-colors flex items-center justify-center z-20"
              >
                <div className="h-full w-px bg-border-inner group-hover:bg-accent/40 transition-colors" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
