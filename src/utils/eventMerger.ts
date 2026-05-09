import { HighlightEvent, ConfidenceLevel } from '../types';

export class EventMerger {
  static mergeNearbyEvents(
    events: HighlightEvent[],
    mergeWindowSeconds: number = 15
  ): HighlightEvent[] {
    if (events.length === 0) return [];

    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const mergedEvents: HighlightEvent[] = [];
    let currentGroup: HighlightEvent[] = [sortedEvents[0]];

    for (let i = 1; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const lastInGroup = currentGroup[currentGroup.length - 1];

      if (
        currentEvent.videoId === lastInGroup.videoId &&
        currentEvent.timestamp - lastInGroup.timestamp <= mergeWindowSeconds
      ) {
        currentGroup.push(currentEvent);
      } else {
        mergedEvents.push(this.mergeGroup(currentGroup, mergeWindowSeconds));
        currentGroup = [currentEvent];
      }
    }

    mergedEvents.push(this.mergeGroup(currentGroup, mergeWindowSeconds));

    return mergedEvents;
  }

  private static mergeGroup(
    group: HighlightEvent[],
    mergeWindowSeconds: number
  ): HighlightEvent {
    if (group.length === 1) return group[0];

    const manualEvents = group.filter((e) => e.source === 'manual');
    const baseEvent = manualEvents.length > 0 ? manualEvents[0] : group[0];

    const avgTimestamp = Math.floor(
      group.reduce((sum, e) => sum + e.timestamp, 0) / group.length
    );

    const avgConfidenceScore =
      group.reduce((sum, e) => e.confidenceScore, 0) / group.length;

    const mergedConfidence = this.calculateMergedConfidence(group);

    const notes = group
      .filter((e) => e.note && e.note.trim() !== '')
      .map((e) => e.note)
      .join(' | ');

    const mergedEventIds = group.map((e) => e.id);

    return {
      ...baseEvent,
      id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: avgTimestamp,
      source: 'merged',
      confidence: mergedConfidence,
      confidenceScore: avgConfidenceScore,
      note: notes || `Merged ${group.length} events`,
      mergedEventIds,
    };
  }

  private static calculateMergedConfidence(
    events: HighlightEvent[]
  ): ConfidenceLevel {
    const hasManual = events.some((e) => e.source === 'manual');
    if (hasManual) return 'high';

    const avgScore =
      events.reduce((sum, e) => e.confidenceScore, 0) / events.length;

    if (avgScore >= 0.8) return 'high';
    if (avgScore >= 0.5) return 'medium';
    return 'low';
  }

  static calculateConfidenceScore(
    source: HighlightEvent['source'],
    metrics?: {
      activityRatio?: number;
      repeatedWordsCount?: number;
      repeatedEmotesCount?: number;
    }
  ): number {
    if (source === 'manual') return 1.0;

    if (source === 'chat_spike' && metrics) {
      let score = 0.5;

      if (metrics.activityRatio) {
        score += Math.min(metrics.activityRatio / 10, 0.3);
      }

      if (metrics.repeatedWordsCount) {
        score += Math.min(metrics.repeatedWordsCount / 20, 0.1);
      }

      if (metrics.repeatedEmotesCount) {
        score += Math.min(metrics.repeatedEmotesCount / 10, 0.1);
      }

      return Math.min(score, 1.0);
    }

    return 0.5;
  }

  static getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }
}
