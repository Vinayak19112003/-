
"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  } from "@/components/ui/select"

type DateRangeFilterProps = {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
};

export function DateRangeFilter({
  date,
  onDateChange,
  className,
}: DateRangeFilterProps) {
  const handlePresetChange = (value: string) => {
    const now = new Date();
    if (value === 'last7') {
        onDateChange({ from: subDays(now, 6), to: now });
    } else if (value === 'thisMonth') {
        onDateChange({ from: startOfMonth(now), to: now });
    } else {
        onDateChange(undefined); // 'all'
    }
  }
  
  return (
    <div className={cn("grid gap-2 sm:flex", className)}>
       <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="last7">Last 7 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
       </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
