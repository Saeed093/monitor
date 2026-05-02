"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SOURCE_TYPES, PROVINCES } from "@/lib/constants";
import { createRawPost } from "@/lib/api";
import type { ProcessResponse } from "@/lib/types";

interface AddSignalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddSignalModal({
  open,
  onOpenChange,
  onSuccess,
}: AddSignalModalProps) {
  const [sourceType, setSourceType] = useState("Manual");
  const [source, setSource] = useState("manual");
  const [text, setText] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSourceType("Manual");
    setSource("manual");
    setText("");
    setPostUrl("");
    setCity("");
    setProvince("");
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await createRawPost({
        source: source || "manual",
        source_type: sourceType,
        text: text.trim(),
        post_url: postUrl || undefined,
        city: city || undefined,
        province: province || undefined,
      });
      setResult(resp);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process signal");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const inputClass =
    "w-full h-9 px-3 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Signal</DialogTitle>
          <DialogDescription>
            Submit a raw post or signal for AI analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Source Type */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className={inputClass}
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Source Name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Source Name
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. manual, twitter_feed"
              className={inputClass}
            />
          </div>

          {/* Text Content */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Text Content *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the raw post, tweet, or news snippet here..."
              rows={4}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Source URL (optional)
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* City & Province */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                City (optional)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Islamabad"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Province (optional)
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={inputClass}
              >
                <option value="">Select...</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Submit Signal"}
          </Button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-3 bg-muted/50 border border-border rounded-md space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Result
              </div>
              {result.event ? (
                <>
                  <div className="text-sm text-foreground font-medium">
                    {result.event.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Type: {result.event.event_type} | Severity:{" "}
                    {result.event.severity} | Confidence:{" "}
                    {Math.round((result.event.confidence ?? 0) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.event_created ? "New event created" : "Merged into existing event"}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Not classified as an event
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
