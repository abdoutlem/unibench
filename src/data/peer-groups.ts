import { PeerGroup } from "@/types";

export const peerGroups: PeerGroup[] = [
  {
    id: "pg-research-public",
    name: "Research Public Universities",
    description: "Large public research universities with R1 Carnegie classification",
    criteria: [
      "Carnegie Classification: R1 Doctoral Universities",
      "Public institution",
      "Total enrollment > 25,000",
    ],
    institutionCount: 12,
  },
  {
    id: "pg-aau",
    name: "AAU Member Institutions",
    description: "Members of the Association of American Universities",
    criteria: [
      "AAU membership",
      "Leading research institutions",
    ],
    institutionCount: 10,
  },
  {
    id: "pg-flagship",
    name: "State Flagship Universities",
    description: "Primary public university in each state",
    criteria: [
      "Designated state flagship",
      "Public institution",
      "Comprehensive academic programs",
    ],
    institutionCount: 9,
  },
  {
    id: "pg-big-ten",
    name: "Big Ten Academic Alliance",
    description: "Members of the Big Ten Academic Alliance",
    criteria: [
      "Big Ten Conference membership",
      "Academic alliance participation",
    ],
    institutionCount: 6,
  },
  {
    id: "pg-regional-midwest",
    name: "Midwest Regional Peers",
    description: "Public universities in the Midwest region",
    criteria: [
      "Located in Midwest region",
      "Public institution",
      "Enrollment > 30,000",
    ],
    institutionCount: 5,
  },
];

export const getPeerGroupById = (id: string) =>
  peerGroups.find((pg) => pg.id === id);
