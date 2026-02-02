import { create } from "zustand";
import { FilterState } from "@/types";

interface FiltersStore extends FilterState {
  setSelectedInstitutions: (ids: string[]) => void;
  setSelectedPeerGroup: (id: string | null) => void;
  setSelectedMetrics: (ids: string[]) => void;
  setFiscalYearRange: (start: number, end: number) => void;
  reset: () => void;
}

const defaultFilters: FilterState = {
  selectedInstitutionIds: [],
  selectedPeerGroupId: "pg-research-public",
  selectedMetricIds: [],
  fiscalYearStart: 2014,
  fiscalYearEnd: 2024,
};

export const useFiltersStore = create<FiltersStore>((set) => ({
  ...defaultFilters,
  setSelectedInstitutions: (ids) => set({ selectedInstitutionIds: ids }),
  setSelectedPeerGroup: (id) => set({ selectedPeerGroupId: id }),
  setSelectedMetrics: (ids) => set({ selectedMetricIds: ids }),
  setFiscalYearRange: (start, end) =>
    set({ fiscalYearStart: start, fiscalYearEnd: end }),
  reset: () => set(defaultFilters),
}));
