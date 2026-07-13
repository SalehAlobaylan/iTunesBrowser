'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { SystemIncidentEpisode } from '@/types/platform/system-autopilot';

interface SystemIncidentCloseDialogProps {
  episode: SystemIncidentEpisode | null;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (episodeID: string, reason: string) => void;
}

export function SystemIncidentCloseDialog({
  episode,
  open,
  pending = false,
  onOpenChange,
  onConfirm,
}: SystemIncidentCloseDialogProps) {
  const [reason, setReason] = useState('');
  const trimmedReason = reason.trim();

  useEffect(() => {
    if (open) setReason('');
  }, [open, episode?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close System Health incident</DialogTitle>
          <DialogDescription>
            {episode
              ? `${episode.root_service} · ${episode.verdict}. A later confirmed signal opens a new incident.`
              : 'A later confirmed signal opens a new incident.'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Close reason"
          value={reason}
          maxLength={2000}
          placeholder="Record why this incident is being closed"
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!episode || !trimmedReason || pending}
            onClick={() => episode && onConfirm(episode.id, trimmedReason)}
          >
            Close incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
