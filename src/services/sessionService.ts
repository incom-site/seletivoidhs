import { SessionMetrics, Candidate } from '../types/candidate';

const sessions = new Map<string, {
  analystEmail: string;
  startTime: number;
  reviews: Array<{
    status: 'Classificado' | 'Desclassificado' | 'Revisar';
    duration: number;
  }>;
}>();

let candidatesCache: Candidate[] = [];

export function setCandidatesForMetrics(candidates: Candidate[]) {
  candidatesCache = candidates;
}

export async function createSession(analystEmail: string): Promise<string | null> {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  sessions.set(sessionId, {
    analystEmail,
    startTime: Date.now(),
    reviews: []
  });

  return sessionId;
}

export async function createReview(
  candidateRegistrationNumber: string,
  status: 'Classificado' | 'Desclassificado' | 'Revisar',
  sessionId: string,
  analystEmail: string,
  durationSeconds: number
): Promise<boolean> {
  const session = sessions.get(sessionId);

  if (!session) {
    console.error('Session not found');
    return false;
  }

  session.reviews.push({
    status,
    duration: durationSeconds
  });

  return true;
}

export async function getSessionMetrics(sessionId: string): Promise<SessionMetrics | null> {
  const session = sessions.get(sessionId);

  const classified = candidatesCache.filter(c => c.statusTriagem === 'Classificado').length;
  const disqualified = candidatesCache.filter(c => c.statusTriagem === 'Desclassificado').length;
  const review = candidatesCache.filter(c => c.statusTriagem === 'Revisar').length;
  const totalReviewed = classified + disqualified + review;

  let averageTimePerCandidate = 0;
  if (session && session.reviews.length > 0) {
    const totalDuration = session.reviews.reduce((sum, r) => sum + r.duration, 0);
    averageTimePerCandidate = Math.round(totalDuration / session.reviews.length);
  }

  return {
    totalReviewed,
    averageTimePerCandidate,
    classified,
    disqualified,
    review
  };
}

export async function endSession(sessionId: string, totalReviewed: number): Promise<boolean> {
  sessions.delete(sessionId);
  return true;
}
