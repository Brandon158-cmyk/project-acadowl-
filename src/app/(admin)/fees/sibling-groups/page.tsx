'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UsersRound, Calculator, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';

interface SiblingGroup {
  guardianId: string;
  guardianName: string;
  children: {
    studentId: string;
    studentName: string;
    gradeName: string;
    rank: number;
    discountPercent: number;
  }[];
  totalExpectedFees: number;
  totalDiscount: number;
}

export default function SiblingGroupsPage() {
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [calculatingGroup, setCalculatingGroup] = useState<SiblingGroup | null>(null);

  const terms = useQuery(api.terms.getActiveTerms);
  const siblingGroups = useQuery(
    api.fees.siblingDiscount.getSiblingGroups,
    selectedTermId ? { termId: selectedTermId as any } : 'skip'
  );

  const toggleExpand = (guardianId: string) => {
    setExpandedGroup(expandedGroup === guardianId ? null : guardianId);
  };

  if (terms === undefined) {
    return <SiblingGroupsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sibling Groups"
        description="Manage sibling discounts for families with multiple children"
      />

      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <Select value={selectedTermId} onValueChange={setSelectedTermId}>
          <SelectTrigger className="w-[200px] text-[13px]">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {terms?.map((term) => (
              <SelectItem key={term._id} value={term._id} className="text-[13px]">{term.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTermId ? (
        siblingGroups !== undefined ? (
          siblingGroups.length > 0 ? (
            <div className="space-y-4">
              {siblingGroups.map((group: SiblingGroup) => (
                <SectionCard
                  key={group.guardianId}
                  title={group.guardianName}
                  description={`${group.children.length} children enrolled`}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalculatingGroup(group)}
                      className="gap-1 text-[12px]"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      Preview Discount
                    </Button>
                  }
                >
                  <div className="divide-y divide-border-row">
                    {group.children.map((child, index) => (
                      <div key={child.studentId} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium ${
                            index === 0 ? 'bg-warning-bg text-warning' :
                            index === 1 ? 'bg-success-bg text-success' :
                            'bg-accent-bg text-accent'
                          }`}>
                            {child.rank === 1 ? '1st' : child.rank === 2 ? '2nd' : `${child.rank}th`}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-text-primary">{child.studentName}</p>
                            <p className="text-[11px] text-text-secondary">{child.gradeName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[11px]">
                            {child.discountPercent}% off
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {/* Group Summary */}
                    <div className="px-5 py-3 bg-surface-subtle">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-text-secondary">Total Family Savings</span>
                        <span className="text-[15px] font-semibold text-success">{formatZMW(group.totalDiscount)}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          ) : (
            <div className="py-12">
              <Empty
                title="No sibling groups found"
                description="No guardians with multiple children enrolled this term"
                icon={UsersRound}
              />
            </div>
          )
        ) : (
          <Skeleton className="h-96" />
        )
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-text-secondary">Select a term to view sibling groups</p>
        </div>
      )}

      {/* Discount Preview Dialog */}
      <Dialog open={!!calculatingGroup} onOpenChange={() => setCalculatingGroup(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Sibling Discount Preview</DialogTitle>
          </DialogHeader>
          {calculatingGroup && (
            <div className="py-4 space-y-4">
              <p className="text-[14px] text-text-secondary">Family: <span className="font-medium text-text-primary">{calculatingGroup.guardianName}</span></p>
              
              <div className="space-y-2">
                {calculatingGroup.children.map((child) => (
                  <div key={child.studentId} className="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                    <div>
                      <p className="text-[13px] font-medium text-text-primary">{child.studentName}</p>
                      <p className="text-[11px] text-text-secondary">{child.gradeName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[11px]">
                        {child.discountPercent}% discount
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-text-secondary">Total Expected Fees</span>
                  <span className="text-[15px] font-medium text-text-primary">{formatZMW(calculatingGroup.totalExpectedFees)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[13px] text-text-secondary">Total Sibling Discount</span>
                  <span className="text-[18px] font-semibold text-success">{formatZMW(calculatingGroup.totalDiscount)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-inner">
                  <span className="text-[14px] font-medium text-text-primary">Net Amount Due</span>
                  <span className="text-[20px] font-semibold text-accent">{formatZMW(calculatingGroup.totalExpectedFees - calculatingGroup.totalDiscount)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCalculatingGroup(null)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SiblingGroupsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}
