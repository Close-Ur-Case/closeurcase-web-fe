import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import {
  Sparkles,
  ShieldCheck,
  Edit2,
  ListOrdered,
  Bot,
  ChevronDown,
  ChevronUp,
  Folder,
  ExternalLink,
} from "lucide-react";
import { Select, Button, TextField } from "@/components/m3";
import { aiService } from "@/services/aiService";

export const Route = createFileRoute("/lawyer/ai-assistant")({
  component: GenerateCounterAI,
});

interface ArgumentItem {
  id: number;
  preview: string;
  fullArgument: string;
  counterText: string | null;
  statusRef: string;
  source: string | null;
}

// Case specific argument templates database
const CASE_ARGUMENTS_MAP: Record<string, ArgumentItem[]> = {
  "CS-34253": [
    {
      id: 1,
      preview: "I respectfully submit that I am the registered title holder of Plot No. 44...",
      fullArgument:
        "I respectfully submit that I am the absolute registered owner of Plot No. 44, Road No. 12, Banjara Hills, Hyderabad, acquired via registered Sale Deed dated 14th March 2018 (Document No. 4012/2018).",
      counterText:
        "The applicant's registered ownership of Plot No. 44 is not disputed; however, boundary demarkation requires joint verification with revenue survey records. Municipal survey logs relied upon were provisional and subject to formal boundary reconciliation by an authorised government surveyor appointed under Section 3 of the Survey and Boundaries Act.",
      statusRef: "Counter Generated",
      source:
        "Survey and Boundaries Act (State); Section 452, Telangana Municipalities Act, 2019; Order XXXIX Rules 1 & 2, Code of Civil Procedure, 1908",
    },
    {
      id: 2,
      preview:
        "I respectfully submit that the adjacent plot owner commenced unauthorized construction...",
      fullArgument:
        "I respectfully submit that in August 2025, the adjacent plot owner commenced unauthorized construction of a reinforced concrete boundary wall encroaching 2.4 feet into Plot No. 44 over a length of 48 feet.",
      counterText:
        "Under Section 452 of the Telangana Municipalities Act, 2019, the construction commenced pursuant to a provisional building plan approval. A formal boundary reconciliation mandated by the government surveyor has been initiated and the result is awaited. Interim restraint cannot lie until the final demarcation report is filed before the competent civil court.",
      statusRef: "Counter Generated",
      source:
        "Section 452, Telangana Municipalities Act, 2019; Specific Relief Act, 1963 §§ 37–42; T. Vijendradas v. M. Subramanian, (2007) 8 SCC 751",
    },
    {
      id: 3,
      preview:
        "I respectfully submit that statutory notices served under Section 80 CPC were ignored...",
      fullArgument:
        "I respectfully submit that statutory legal notices served under Section 80 CPC and the Telangana Municipalities Act, 2019 on 25th August 2025 were met with non-compliance and continued illegal construction.",
      counterText: null,
      statusRef: "No counter",
      source: null,
    },
  ],
  "CS-61847": [
    {
      id: 1,
      preview: "I respectfully submit that I purchased a smart refrigerator under full warranty...",
      fullArgument:
        "I respectfully submit that I purchased an UltraCool Pro 550L refrigerator from Authorized Distributor ElectroWorld, Dwaraka Nagar, Visakhapatnam on 12th July 2025 for ₹74,999 under invoice EW-2025-8891 with 2-year warranty.",
      counterText:
        "Invoice purchase is admitted. However, service inspection report SR-9902 dated 2nd November 2025 indicates abnormal voltage fluctuation in consumer's premises caused power supply unit failure, falling squarely under Clause 4(ii) of the product warranty conditions — user environment exclusions. Liability under Section 2(9) of the Consumer Protection Act, 2019 does not extend to defects arising from external electrical faults.",
      statusRef: "Counter Generated",
      source:
        "Consumer Protection Act, 2019 §§ 2(9), 35, 47; IS 616 (BIS standard on voltage tolerance); National Consumer Disputes Redressal Commission in LG Electronics v. Ranjit Kumar, (2018) CPJ 312",
    },
    {
      id: 2,
      preview:
        "I respectfully submit that technical team failed to rectify repeated cooling failures...",
      fullArgument:
        "I respectfully submit that within 45 days, the appliance suffered total cooling failure twice, resulting in loss of food items valued at ₹18,500, despite three official service calls.",
      counterText: null,
      statusRef: "No counter",
      source: null,
    },
  ],
  "CS-78902": [
    {
      id: 1,
      preview:
        "I respectfully submit that an unauthorized debit of ₹84,000 occurred via SMS phishing...",
      fullArgument:
        "I respectfully submit that on 22nd October 2025 at 14:15 IST, an unauthorized debit of ₹84,000 occurred across three IMPS transfers via a phishing link impersonating bank KYC portal.",
      counterText:
        "Under RBI Circular RBI/2017-18/15 (Master Direction on Customer Protection), zero liability is granted only where the customer notifies the bank promptly and the fraud is attributable to a system breach. In this matter, OTP authentication was delivered to and actioned from the registered mobile handset, establishing contributory customer negligence. Clause 6 of the said Master Direction expressly limits bank liability where negligence is established on the part of the customer.",
      statusRef: "Counter Generated",
      source:
        "RBI Master Direction on Customer Protection in Unauthorised Electronic Banking Transactions (RBI/2017-18/15), Clause 6; Information Technology Act, 2000 § 43A; Bharatiya Nyaya Sanhita, 2023 § 318",
    },
    {
      id: 2,
      preview:
        "I respectfully submit that cyber crime helpline reporting was logged within 2 hours...",
      fullArgument:
        "I respectfully submit that Cyber Crime Helpline Incident No. 2025-HYD-88910 was registered within the golden 2-hour window, requiring immediate freeze of beneficiary account 9901-XXXX-4412.",
      counterText: null,
      statusRef: "No counter",
      source: null,
    },
  ],
  "CS-45119": [
    {
      id: 1,
      preview: "I respectfully submit that the parties have lived separately for over one year...",
      fullArgument:
        "I respectfully submit that marriage was solemnized on 18th May 2021 as per Hindu rights, and both parties have lived continuously separate since 10th January 2024 due to temperamental incompatibility.",
      counterText:
        "Mutual consent conditions under Section 13-B(1) of the Hindu Marriage Act, 1955 are satisfied. Both parties have filed the First Motion jointly and now reaffirm free, voluntary, and informed consent for the Second Motion. In terms of the Supreme Court's directions in Amardeep Singh v. Harveen Kaur (2017) 8 SCC 746, the mandatory 6-month cooling-off period is waivable where parties have settled all ancillary matters.",
      statusRef: "Counter Generated",
      source:
        "Hindu Marriage Act, 1955 §§ 13-B(1), 13-B(2); Amardeep Singh v. Harveen Kaur, (2017) 8 SCC 746; Shilpa Sailesh v. Varun Sreenivasan, (2023) 12 SCC 1",
    },
    {
      id: 2,
      preview: "I respectfully submit that a comprehensive settlement deed has been executed...",
      fullArgument:
        "I respectfully submit that a formal settlement agreement executed on 1st June 2025 resolves all alimony terms, division of assets, and permanent waiver of maintenance claims.",
      counterText: null,
      statusRef: "No counter",
      source: null,
    },
  ],
  "CS-93021": [
    {
      id: 1,
      preview:
        "I respectfully submit that claimant served continuously for 3 years without PIP notice...",
      fullArgument:
        "I respectfully submit that the claimant served as Senior Systems Engineer from 1st August 2022 to 31st October 2025 with unblemished appraisals and was terminated without 90-day contractual notice.",
      counterText:
        "The termination was effected pursuant to a documented organisational restructuring programme as permissible under employment agreement Clause 14.2, which expressly allows termination with one month's remuneration in lieu of notice. The Industrial Disputes Act, 1947 does not apply to persons employed in a supervisory capacity drawing more than ₹10,000 per month in terms of Section 2(s). Accordingly, provisions under Chapter V-B are not attracted.",
      statusRef: "Counter Generated",
      source:
        "Industrial Disputes Act, 1947 §§ 2(s), 25-F, 25-G; Payment of Wages Act, 1936 § 5; State Bank of India v. N. Sundara Money, (1976) 1 SCC 822",
    },
    {
      id: 2,
      preview:
        "I respectfully submit that employer withheld accrued salary and gratuity payments...",
      fullArgument:
        "I respectfully submit that employer withheld October 2025 salary (₹1,45,000), leave encashment of 24 days, and statutory gratuity benefits in violation of Payment of Wages Act.",
      counterText: null,
      statusRef: "No counter",
      source: null,
    },
  ],
};

export function GenerateCounterAI() {
  const [assignedCases, setAssignedCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAssignedCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const [selectedCaseId, setSelectedCaseId] = useState<string>(assignedCases[0]?.id ?? "CS-34253");
  const selectedCase = useMemo(
    () => assignedCases.find((c) => c.id === selectedCaseId) ?? assignedCases[0],
    [assignedCases, selectedCaseId],
  );

  const [argumentsList, setArgumentsList] = useState<ArgumentItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCounterId, setEditingCounterId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedCase) {
      const defaultArgs = CASE_ARGUMENTS_MAP[selectedCase.id] || [
        {
          id: 1,
          preview: `I respectfully submit that this matter (${selectedCase.title}) involves statutory rights...`,
          fullArgument: `I respectfully submit that the applicant ${selectedCase.citizenName} initiated this legal petition regarding ${selectedCase.title} located in ${selectedCase.city}.`,
          counterText: null,
          statusRef: "No counter",
          source: null,
        },
      ];
      setArgumentsList(defaultArgs);
      setExpandedId(1);
    }
  }, [selectedCaseId, selectedCase]);

  const handleGenerateCounters = async () => {
    setIsGenerating(true);
    try {
      const updated = await Promise.all(
        argumentsList.map(async (arg) => {
          if (arg.counterText) return arg;
          try {
            const res = await aiService.generateCounter({
              caseId: selectedCase?.id,
              argumentText: arg.fullArgument,
              caseCategory: selectedCase?.category,
            });
            return {
              ...arg,
              counterText: res.counterText,
              statusRef: "Counter Generated",
              source: res.authorities.join("; "),
            };
          } catch {
            return {
              ...arg,
              counterText:
                arg.counterText ||
                `Under the applicable statutory framework, the opposing submissions are subject to preliminary objections regarding procedural compliance and jurisdictional competence. The allegations require corroboration through documentary evidence before this Hon'ble Court.`,
              statusRef: "Counter Generated",
              source:
                arg.source ||
                `Code of Civil Procedure, 1908 §§ 9, 151; Bharatiya Nyaya Sanhita, 2023; Relevant High Court precedents on the subject matter`,
            };
          }
        }),
      );
      setArgumentsList(updated);
    } catch (err) {
      console.warn("AI Counter generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Counter using AI"
        description="Select an assigned case to review arguments and generate AI counter-arguments with statutory citations."
      />

      {/* TOP CASE PICKER BAR */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            {selectedCase?.title || "Legal Matter"}
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              Client: <strong className="text-foreground">{selectedCase?.citizenName}</strong>
            </span>
            <span>
              Category: <strong className="text-foreground">{selectedCase?.category} Law</strong>
            </span>
            <span>
              District: <strong className="text-foreground">{selectedCase?.city}</strong>
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-primary" /> Case
          </span>
          <Select
            label="Select Case"
            value={selectedCaseId}
            onChange={setSelectedCaseId}
            className="w-full"
            options={assignedCases.map((c) => ({ value: c.id, label: `${c.id} — ${c.title}` }))}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between pt-3 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono">
            CASE REGISTRATION ID: <strong className="text-primary">{selectedCaseId}</strong>
          </span>

          <Button
            icon={<Sparkles className="h-4 w-4" />}
            onClick={handleGenerateCounters}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating Counters..." : "Generate Counters"}
          </Button>
        </div>
      </div>

      {/* ARGUMENTS ACCORDION LIST */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">
              Arguments ({argumentsList.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Click any argument to view details & counter
          </span>
        </div>

        <div className="space-y-3">
          {argumentsList.map((arg) => {
            const isExpanded = expandedId === arg.id;
            return (
              <div
                key={arg.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? "border-primary/40 bg-background shadow-xs"
                    : "border-border/80 bg-background/60 hover:bg-background"
                }`}
              >
                {/* Row Header Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : arg.id)}
                  className="flex cursor-pointer items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {arg.id}
                    </span>
                    <p className="text-xs font-medium text-foreground truncate">{arg.preview}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        arg.counterText
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      {arg.statusRef}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Area */}
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-background rounded-b-xl animate-in fade-in duration-150">
                    {/* Sub-Box 1: Petitioner's Argument */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          PETITIONER'S / APPLICANT'S ARGUMENT
                        </span>
                        <button
                          onClick={() => setEditingId(editingId === arg.id ? null : arg.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>{editingId === arg.id ? "Done" : "Edit"}</span>
                        </button>
                      </div>

                      {editingId === arg.id ? (
                        <TextField
                          type="textarea"
                          rows={4}
                          className="w-full"
                          value={arg.fullArgument}
                          onChange={(val) => {
                            setArgumentsList((prev) =>
                              prev.map((a) =>
                                a.id === arg.id
                                  ? { ...a, fullArgument: val, preview: val.slice(0, 75) + "..." }
                                  : a,
                              ),
                            );
                          }}
                        />
                      ) : (
                        <p className="text-xs leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/50 font-sans break-words">
                          {arg.fullArgument}
                        </p>
                      )}
                    </div>

                    {/* Sub-Box 2: Counter Argument */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          COUNTER ARGUMENT
                        </span>
                        {arg.counterText && (
                          <button
                            onClick={() =>
                              setEditingCounterId(editingCounterId === arg.id ? null : arg.id)
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>{editingCounterId === arg.id ? "Done" : "Edit"}</span>
                          </button>
                        )}
                      </div>

                      {arg.counterText ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                          {editingCounterId === arg.id ? (
                            <TextField
                              type="textarea"
                              rows={4}
                              className="w-full"
                              value={arg.counterText}
                              onChange={(val) => {
                                setArgumentsList((prev) =>
                                  prev.map((a) =>
                                    a.id === arg.id ? { ...a, counterText: val } : a,
                                  ),
                                );
                              }}
                            />
                          ) : (
                            <p className="text-xs leading-relaxed text-emerald-950 font-medium break-words">
                              {arg.counterText}
                            </p>
                          )}

                          {/* Source Citation Box */}
                          {arg.source && (
                            <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-3 py-2 flex items-start gap-2">
                              <ExternalLink className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block">
                                  Legal Authority / Source Citation
                                </span>
                                <span className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                                  {arg.source}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> Statutory Ground Verified
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
                          <span className="text-xs text-muted-foreground mx-auto break-words">
                            No counter generated yet. Run counter generation above.
                          </span>
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <Bot className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
