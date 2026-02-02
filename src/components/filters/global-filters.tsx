"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFiltersStore } from "@/store";
import { peerGroups, institutions } from "@/data";
import { RotateCcw } from "lucide-react";

const yearOptions = Array.from({ length: 11 }, (_, i) => ({
  value: String(2014 + i),
  label: `FY ${2014 + i}`,
}));

const peerGroupOptions = peerGroups.map((pg) => ({
  value: pg.id,
  label: pg.name,
}));

const institutionOptions = institutions.map((inst) => ({
  value: inst.id,
  label: inst.shortName,
}));

export function GlobalFilters() {
  const {
    selectedPeerGroupId,
    fiscalYearStart,
    fiscalYearEnd,
    setSelectedPeerGroup,
    setFiscalYearRange,
    reset,
  } = useFiltersStore();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Peer Group:</label>
        <Select
          value={selectedPeerGroupId || ""}
          onValueChange={setSelectedPeerGroup}
          options={peerGroupOptions}
          className="w-48"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">From:</label>
        <Select
          value={String(fiscalYearStart)}
          onValueChange={(v) => setFiscalYearRange(parseInt(v), fiscalYearEnd)}
          options={yearOptions}
          className="w-28"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">To:</label>
        <Select
          value={String(fiscalYearEnd)}
          onValueChange={(v) => setFiscalYearRange(fiscalYearStart, parseInt(v))}
          options={yearOptions}
          className="w-28"
        />
      </div>

      <Button variant="outline" size="sm" onClick={reset}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Reset
      </Button>
    </div>
  );
}
