
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Trade, TradeSchema, type TradingModel } from "@/lib/types";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMistakeTags } from "@/hooks/use-mistake-tags";
import { AddMistakeTagDialog } from "./add-mistake-tag-dialog";
import { useAssets } from "@/hooks/use-assets";
import { AddAssetDialog } from "./add-asset-dialog";
import { useStrategies } from "@/hooks/use-strategies";
import { AddStrategyDialog } from "./add-strategy-dialog";
import { useTradingRules } from "@/hooks/use-trading-rules";
import { AddTradingRuleDialog } from "./add-trading-rule-dialog";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { useStreamerMode } from "@/contexts/streamer-mode-context";
import { Separator } from "../ui/separator";
import { useTrades } from "@/contexts/trades-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useTradingModel, type ModelSection } from "@/hooks/use-trading-model";
import { useAccountContext } from "@/contexts/account-context";

const FormSchema = TradeSchema.omit({ id: true }).extend({
    screenshotFile: z.instanceof(File).optional(),
});

const emotionalStates = ["Focused", "Anxious", "FOMO", "Greedy", "Confident", "Tired", "Neutral", "Other"];
const sessions = ["London", "New York", "Asian"];
const timeFrames = ["1m", "3m", "5m", "15m", "1h", "4h", "Daily"];

type TradeFormProps = {
  trade?: Trade;
  onSaveSuccess: () => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const ChecklistSection = ({ name, title, items, control }: { name: `modelFollowed.${ModelSection}`; title: string; items: string[]; control: any }) => {
    if (items.length === 0) return null;
    return (
        <FormField
            control={control}
            name={name}
            render={() => (
                <FormItem>
                    <div className="mb-2">
                        <FormLabel className="text-base">{title}</FormLabel>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {items.map((item) => (
                            <FormField
                                key={item}
                                control={control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item)}
                                                onCheckedChange={(checked) => {
                                                    const currentValues = field.value || [];
                                                    return checked
                                                        ? field.onChange([...currentValues, item])
                                                        : field.onChange(currentValues.filter((value) => value !== item));
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{item}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export function TradeForm({ 
    trade, 
    onSaveSuccess, 
    setOpen, 
}: TradeFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { isStreamerMode } = useStreamerMode();

  const { addTrade, updateTrade } = useTrades();
  const { strategies, addStrategy, deleteStrategy } = useStrategies();
  const { tradingRules, addTradingRule, deleteTradingRule } = useTradingRules();
  const { mistakeTags, addMistakeTag, deleteMistakeTag } = useMistakeTags();
  const { assets, addAsset, deleteAsset } = useAssets();
  const { model: tradingModel } = useTradingModel();
  const { accounts, selectedAccountId } = useAccountContext();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: trade
      ? { 
          ...trade,
          accountId: trade.accountId,
          rr: trade.rr ?? 0,
          confidence: trade.confidence ?? 5,
          accountSize: trade.accountSize ?? 0,
          riskPercentage: trade.riskPercentage ?? 0,
          pnl: trade.pnl ?? 0,
          mistakes: trade.mistakes ?? [],
          rulesFollowed: trade.rulesFollowed ?? [],
          modelFollowed: trade.modelFollowed ?? { week: [], day: [], trigger: [], ltf: [] },
          exitTime: trade.exitTime ?? "",
          notes: trade.notes ?? "",
          ticket: trade.ticket ?? "",
          preTradeEmotion: trade.preTradeEmotion ?? "",
          postTradeEmotion: trade.postTradeEmotion ?? "",
          marketContext: trade.marketContext ?? "",
          entryReason: trade.entryReason ?? "",
          tradeFeelings: trade.tradeFeelings ?? "",
          lossAnalysis: trade.lossAnalysis ?? "",
          session: trade.session,
          keyLevel: trade.keyLevel ?? "",
          entryTimeFrame: trade.entryTimeFrame,
        }
      : {
          accountId: selectedAccountId,
          date: new Date(),
          asset: "",
          strategy: "",
          direction: "Buy",
          entryTime: "",
          exitTime: "",
          entryPrice: 0,
          sl: 0,
          exitPrice: 0,
          rr: 0,
          result: "Win",
          confidence: 5,
          mistakes: [],
          rulesFollowed: [],
          modelFollowed: { week: [], day: [], trigger: [], ltf: [] },
          notes: "",
          screenshotURL: "",
          accountSize: 0,
          riskPercentage: 0,
          pnl: 0,
          ticket: "",
          preTradeEmotion: "",
          postTradeEmotion: "",
          marketContext: "",
          entryReason: "",
          tradeFeelings: "",
          lossAnalysis: "",
          session: undefined,
          keyLevel: "",
          entryTimeFrame: undefined,
        },
  });

  const { watch, setValue } = form;
  const entryPrice = watch("entryPrice");
  const sl = watch("sl");
  const exitPrice = watch("exitPrice");
  const accountSize = watch("accountSize");
  const riskPercentage = watch("riskPercentage");
  const rr = watch("rr");
  const result = watch("result");
  const accountId = watch("accountId");
  const direction = watch("direction");

  // Set account size when account changes or when editing a trade
  useEffect(() => {
    if (trade) {
        // If editing, the accountSize is fixed to what it was when the trade was made.
        setValue("accountSize", trade.accountSize);
    } else {
        // For new trades, get the latest balance.
        const selectedAccount = accounts.find((acc: any) => acc.id === accountId);
        if (selectedAccount) {
            const currentBalance = selectedAccount.currentBalance ?? selectedAccount.initialBalance;
            setValue("accountSize", currentBalance);
        }
    }
  }, [accountId, accounts, setValue, trade]);


  useEffect(() => {
    const entry = parseFloat(entryPrice as any);
    const stopLoss = parseFloat(sl as any);
    const exit = parseFloat(exitPrice as any);

    if (!isNaN(entry) && !isNaN(stopLoss) && !isNaN(exit) && stopLoss !== entry) {
        const risk = Math.abs(entry - stopLoss);
        let reward = 0;
        if (direction === 'Buy') {
            reward = exit - entry;
        } else { // Sell
            reward = entry - exit;
        }
        // RR should always be positive, reward itself can be negative if trade is a loss.
        const calculatedRr = risk > 0 ? Math.abs(reward) / risk : 0;
        setValue("rr", parseFloat(calculatedRr.toFixed(2)));
    } else {
        setValue("rr", 0);
    }
}, [entryPrice, sl, exitPrice, direction, setValue]);

  useEffect(() => {
    const size = parseFloat(accountSize as any);
    const riskPercent = parseFloat(riskPercentage as any);
    const rRatio = parseFloat(rr as any);
    const tradeResult = result;
    
    if (!isNaN(size) && size > 0 && !isNaN(riskPercent) && riskPercent > 0) {
        const riskAmount = size * (riskPercent / 100);
        let calculatedPnl = 0;
        if (tradeResult === 'Win' && !isNaN(rRatio)) {
            calculatedPnl = riskAmount * rRatio;
        } else if (tradeResult === 'Loss') {
            calculatedPnl = -riskAmount;
        }
        setValue("pnl", parseFloat(calculatedPnl.toFixed(2)));
    } else {
        setValue("pnl", 0);
    }
}, [accountSize, riskPercentage, rr, result, setValue]);


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSaving(true);
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a trade.' });
        setIsSaving(false);
        return;
    }

    try {
        const tradeId = trade?.id || crypto.randomUUID();
        let screenshotURL: string | undefined = trade?.screenshotURL;

        if (data.screenshotFile) {
            const file = data.screenshotFile;
            const filePath = `screenshots/${user.uid}/${tradeId}/${file.name}`;
            const fileRef = storageRef(storage, filePath);
            await uploadBytes(fileRef, file);
            screenshotURL = await getDownloadURL(fileRef);
        }

        const tradeData = {
            ...data,
            screenshotURL: screenshotURL || "",
        };
        delete (tradeData as any).screenshotFile;
        
        let success = false;
        if (trade) {
            success = await updateTrade({ ...tradeData, id: trade.id });
        } else {
            success = await addTrade(tradeData);
        }
        
        if (success) {
            toast({ title: "Trade Saved!", description: "Your trade has been successfully logged." });
            onSaveSuccess();
        } else {
            throw new Error("Failed to save trade to the database.");
        }

    } catch (error) {
        console.error("Trade save/upload failed:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred during saving.",
            duration: 9000,
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!trade}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {accounts.map((acc: any) => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                     {!!trade && <FormDescription>Account cannot be changed after a trade is logged.</FormDescription>}
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value ? (
                            format(field.value, "PPP")
                            ) : (
                            <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() && !isSameDay(date, new Date())}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="entryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exitTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="asset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                 <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map(asset => (
                            <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AddAssetDialog assets={assets} addAsset={addAsset} deleteAsset={deleteAsset}/>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy</FormLabel>
                 <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a strategy" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {strategies.map(strategy => (
                            <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <AddStrategyDialog strategies={strategies} addStrategy={addStrategy} deleteStrategy={deleteStrategy}/>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="entryTimeFrame"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Entry Time Frame</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time frame" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {timeFrames.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="session"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Session</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="keyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Level</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. 4H OB, Daily FVG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Price</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Loss (SL)</FormLabel>
                <FormControl>
                   <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="exitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exit Price</FormLabel>
                <FormControl>
                   <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Result</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                    <SelectItem value="BE">Break Even (BE)</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="rr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk/Reward (RR)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly className="bg-muted"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="accountSize"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Account Size ($)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} className={cn("bg-muted", isStreamerMode && "blur-sm")} readOnly />
                    </FormControl>
                     <FormDescription>The account balance before this trade.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="riskPercentage"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Risk (%)</FormLabel>
                    <FormControl>
                        <Input type="number" step="any" placeholder="e.g. 1" {...field} className={cn(isStreamerMode && "blur-sm")} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="pnl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Profit/Loss ($)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} readOnly className={cn("bg-muted", isStreamerMode && "blur-sm")}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <Separator />
        
        <h3 className="text-lg font-semibold font-headline">Psychological Analysis</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="preTradeEmotion"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pre-Trade Emotion</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select emotional state" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {emotionalStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="postTradeEmotion"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Post-Trade Emotion</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select emotional state" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {emotionalStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="journal-prompts">
                <AccordionTrigger>Structured Journal Prompts (Optional)</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="marketContext"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>What was the market context leading up to this trade?</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., High-impact news event coming up, consolidating market..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="entryReason"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>What was my primary reason (the "A+ setup") for entry?</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Perfect break and retest of key level..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tradeFeelings"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>How did I feel when the trade moved against me?</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Confident in my stop, anxious and wanted to close..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lossAnalysis"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>If this was a losing trade, was the loss a result of a bad process or bad luck?</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Bad process, I didn't follow my rules. Or, good setup that just failed..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <Separator />

        <h3 className="text-lg font-semibold font-headline">Execution & Review</h3>
        
        <FormField
            control={form.control}
            name="confidence"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Confidence (1-10)</FormLabel>
                <div className="flex items-center gap-4 pt-2">
                    <FormControl>
                        <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                        />
                    </FormControl>
                    <span className="font-bold text-lg w-10 text-center">{field.value}</span>
                </div>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="trading-model-checklist">
                <AccordionTrigger>Trading Model Checklist</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <ChecklistSection name="modelFollowed.week" title="Week Preparation" items={tradingModel.week} control={form.control} />
                    <ChecklistSection name="modelFollowed.day" title="Daily Preparation" items={tradingModel.day} control={form.control} />
                    <ChecklistSection name="modelFollowed.trigger" title="Trigger" items={tradingModel.trigger} control={form.control} />
                    <ChecklistSection name="modelFollowed.ltf" title="LTF Execution" items={tradingModel.ltf} control={form.control} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <FormField
          control={form.control}
          name="rulesFollowed"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                   <FormLabel className="text-base">Rules Followed</FormLabel>
                   <AddTradingRuleDialog 
                    tradingRules={tradingRules}
                    addTradingRule={addTradingRule}
                    deleteTradingRule={deleteTradingRule}
                   />
                </div>
                <FormDescription>
                  Check all the general rules you followed for this trade.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tradingRules.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="rulesFollowed"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked
                                  ? field.onChange([...currentValues, item])
                                  : field.onChange(
                                      currentValues.filter(
                                        (value) => value !== item
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <FormField
          control={form.control}
          name="mistakes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                   <FormLabel className="text-base">Mistakes Made</FormLabel>
                   <AddMistakeTagDialog 
                    mistakeTags={mistakeTags}
                    addMistakeTag={addMistakeTag}
                    deleteMistakeTag={deleteMistakeTag}
                   />
                </div>
                <FormDescription>
                  Select any mistakes you made during this trade.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mistakeTags.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="mistakes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked
                                  ? field.onChange([...currentValues, item])
                                  : field.onChange(
                                      currentValues.filter(
                                        (value) => value !== item
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="ticket"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ticket / Order ID</FormLabel>
                <FormControl>
                    <Input placeholder="Optional: e.g., #12345678" {...field} />
                </FormControl>
                <FormDescription>
                    Provide a unique ticket or order ID to prevent duplicates during import.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other observations or thoughts about this trade."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="screenshotFile"
            render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                <FormLabel>Screenshot</FormLabel>
                {trade?.screenshotURL && !value && (
                    <div className="relative h-24 w-40 rounded-md overflow-hidden">
                        <Image src={trade.screenshotURL} alt="Current screenshot" layout="fill" objectFit="cover" />
                    </div>
                )}
                <FormControl>
                    <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                onChange(e.target.files[0]);
                            }
                        }}
                    />
                </FormControl>
                <FormDescription>
                    Upload an image of your trade setup or result.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
