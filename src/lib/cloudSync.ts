import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeEmail } from './authValidation';
import {
  registerCloudSyncHooks,
  useTournamentStore,
} from '../store/tournamentStore';
import type {
  OrganizerDefaults,
  PointSystemConfig,
  SavedSquadRecord,
  TournamentRecord,
} from '../types/tournament';

let activeSyncEmail: string | null = null;
let metaUnsub: Unsubscribe | null = null;
let tournamentsUnsub: Unsubscribe | null = null;
let squadsUnsub: Unsubscribe | null = null;

const pendingTournamentTimers = new Map<string, ReturnType<typeof setTimeout>>();
let pendingMetaTimer: ReturnType<typeof setTimeout> | null = null;
const deletedTournamentIds = new Set<string>();
const deletedSquadIds = new Set<string>();

function stripUndefinedDeep<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out as T;
  }
  return val;
}

function serializeTournamentForCloud(t: TournamentRecord): Record<string, unknown> {
  const now = Date.now();
  return stripUndefinedDeep({
    id: t.id.slice(0, 128),
    name: (t.name || t.settings.name || 'Tournament').slice(0, 200),
    createdAt: (t.createdAt || '').slice(0, 80),
    createdAtTimestamp: t.createdAtTimestamp || now,
    updatedAt: t.updatedAt || t.createdAtTimestamp || now,
    settings: t.settings,
    teams: t.teams.slice(0, 64),
    matches: t.matches.slice(0, 64),
    isEnded: Boolean(t.isEnded),
    championTeamName: t.championTeamName ? t.championTeamName.slice(0, 160) : null,
    championScore: typeof t.championScore === 'number' ? t.championScore : null,
  });
}

function serializeSquadForCloud(s: SavedSquadRecord): Record<string, unknown> {
  return stripUndefinedDeep({
    id: s.id.slice(0, 128),
    name: s.name.slice(0, 120),
    shortCode: (s.shortCode || 'SQ').slice(0, 16),
    logoUrl: s.logoUrl && s.logoUrl.length <= 880_000 ? s.logoUrl : null,
    player1: s.player1 ? s.player1.slice(0, 120) : null,
    player2: s.player2 ? s.player2.slice(0, 120) : null,
    players: s.players
      ? s.players.slice(0, 12).map((p) => String(p).slice(0, 120))
      : null,
    learnedTokens: s.learnedTokens ? s.learnedTokens.slice(0, 40) : [],
    updatedAt: s.updatedAt || Date.now(),
  });
}

async function pushTournamentNow(emailLower: string, record: TournamentRecord) {
  try {
    useTournamentStore.getState().setCloudSyncStatus('syncing');
    const ref = doc(db, 'user_workspaces', emailLower, 'tournaments', record.id);
    await setDoc(ref, serializeTournamentForCloud(record));
    useTournamentStore.getState().setCloudSyncStatus('synced');
  } catch (err) {
    console.warn('Cloud tournament sync error:', err);
    useTournamentStore.getState().setCloudSyncStatus('offline');
  }
}

async function pushMetaNow(emailLower: string) {
  try {
    const st = useTournamentStore.getState();
    const ref = doc(db, 'user_workspaces', emailLower);
    await setDoc(
      ref,
      stripUndefinedDeep({
        email: emailLower,
        activeTournamentId: st.activeTournamentId || null,
        defaultPointSystem: st.defaultPointSystem,
        organizerDefaults: st.organizerDefaults,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Cloud workspace meta sync error:', err);
  }
}

export function stopCloudWorkspaceSync() {
  activeSyncEmail = null;
  if (metaUnsub) {
    metaUnsub();
    metaUnsub = null;
  }
  if (tournamentsUnsub) {
    tournamentsUnsub();
    tournamentsUnsub = null;
  }
  if (squadsUnsub) {
    squadsUnsub();
    squadsUnsub = null;
  }
  for (const timer of pendingTournamentTimers.values()) {
    clearTimeout(timer);
  }
  pendingTournamentTimers.clear();
  if (pendingMetaTimer) {
    clearTimeout(pendingMetaTimer);
    pendingMetaTimer = null;
  }
  registerCloudSyncHooks({});
  useTournamentStore.getState().setCloudSyncStatus('idle');
}

export function startCloudWorkspaceSync(rawEmail: string) {
  const emailLower = normalizeEmail(rawEmail);
  if (!emailLower) return;
  if (activeSyncEmail === emailLower) return;

  stopCloudWorkspaceSync();
  activeSyncEmail = emailLower;
  useTournamentStore.getState().setCloudSyncStatus('syncing');

  let initialTournamentsSynced = false;
  let initialSquadsSynced = false;

  registerCloudSyncHooks({
    onTournamentUpsert: (record) => {
      if (activeSyncEmail !== emailLower) return;
      deletedTournamentIds.delete(record.id);
      const prev = pendingTournamentTimers.get(record.id);
      if (prev) clearTimeout(prev);
      pendingTournamentTimers.set(
        record.id,
        setTimeout(() => {
          pendingTournamentTimers.delete(record.id);
          const fresh = useTournamentStore
            .getState()
            .tournaments.find((t) => t.id === record.id);
          if (fresh && activeSyncEmail === emailLower) {
            void pushTournamentNow(emailLower, fresh);
          }
        }, 420)
      );
    },
    onTournamentDelete: (tournamentId) => {
      if (activeSyncEmail !== emailLower) return;
      deletedTournamentIds.add(tournamentId);
      const prev = pendingTournamentTimers.get(tournamentId);
      if (prev) {
        clearTimeout(prev);
        pendingTournamentTimers.delete(tournamentId);
      }
      void deleteDoc(
        doc(db, 'user_workspaces', emailLower, 'tournaments', tournamentId)
      ).catch(() => {});
    },
    onSquadsUpsert: (squads) => {
      if (activeSyncEmail !== emailLower) return;
      for (const sq of squads) {
        deletedSquadIds.delete(sq.id);
        void setDoc(
          doc(db, 'user_workspaces', emailLower, 'saved_squads', sq.id),
          serializeSquadForCloud(sq)
        ).catch(() => {});
      }
    },
    onSquadDelete: (squadId) => {
      if (activeSyncEmail !== emailLower) return;
      deletedSquadIds.add(squadId);
      void deleteDoc(
        doc(db, 'user_workspaces', emailLower, 'saved_squads', squadId)
      ).catch(() => {});
    },
    onMetaUpdate: () => {
      if (activeSyncEmail !== emailLower) return;
      if (pendingMetaTimer) clearTimeout(pendingMetaTimer);
      pendingMetaTimer = setTimeout(() => {
        pendingMetaTimer = null;
        if (activeSyncEmail === emailLower) {
          void pushMetaNow(emailLower);
        }
      }, 450);
    },
  });

  metaUnsub = onSnapshot(
    doc(db, 'user_workspaces', emailLower),
    (snap) => {
      if (!snap.exists()) {
        void pushMetaNow(emailLower);
        return;
      }
      const data = snap.data();
      const cloudPointSys = data.defaultPointSystem as PointSystemConfig | undefined;
      const cloudDefaults = data.organizerDefaults as OrganizerDefaults | undefined;
      const cloudActiveId =
        typeof data.activeTournamentId === 'string' ? data.activeTournamentId : undefined;

      useTournamentStore.getState().applyCloudWorkspace({
        defaultPointSystem: cloudPointSys,
        organizerDefaults: cloudDefaults,
        activeTournamentId: cloudActiveId,
      });
    },
    () => {
      useTournamentStore.getState().setCloudSyncStatus('offline');
    }
  );

  tournamentsUnsub = onSnapshot(
    collection(db, 'user_workspaces', emailLower, 'tournaments'),
    (snap) => {
      const cloudMap = new Map<string, TournamentRecord>();
      snap.forEach((docSnap) => {
        const d = docSnap.data() as TournamentRecord;
        if (d && d.id && !deletedTournamentIds.has(d.id)) {
          cloudMap.set(d.id, {
            ...d,
            championTeamName: d.championTeamName || undefined,
            championScore: typeof d.championScore === 'number' ? d.championScore : undefined,
          });
        }
      });

      const localList = useTournamentStore.getState().tournaments;
      const mergedMap = new Map<string, TournamentRecord>();

      for (const [id, cRec] of cloudMap.entries()) {
        mergedMap.set(id, cRec);
      }

      for (const lRec of localList) {
        if (deletedTournamentIds.has(lRec.id)) continue;
        const cRec = cloudMap.get(lRec.id);
        const lTs = lRec.updatedAt ?? lRec.createdAtTimestamp ?? 0;
        const cTs = cRec ? cRec.updatedAt ?? cRec.createdAtTimestamp ?? 0 : -1;

        if (!cRec) {
          if (!initialTournamentsSynced || pendingTournamentTimers.has(lRec.id)) {
            // Local tournament created offline before initial sync -> push up to cloud
            mergedMap.set(lRec.id, lRec);
            void pushTournamentNow(emailLower, lRec);
          }
          // Otherwise it was deleted on another device -> let removal propagate
        } else if (lTs > cTs) {
          mergedMap.set(lRec.id, lRec);
          if (!initialTournamentsSynced) {
            void pushTournamentNow(emailLower, lRec);
          }
        }
      }

      initialTournamentsSynced = true;
      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0)
      );

      useTournamentStore.getState().applyCloudWorkspace({
        tournaments: mergedList,
      });
      useTournamentStore.getState().setCloudSyncStatus('synced');
    },
    () => {
      useTournamentStore.getState().setCloudSyncStatus('offline');
    }
  );

  squadsUnsub = onSnapshot(
    collection(db, 'user_workspaces', emailLower, 'saved_squads'),
    (snap) => {
      const cloudSquads = new Map<string, SavedSquadRecord>();
      snap.forEach((docSnap) => {
        const d = docSnap.data() as SavedSquadRecord;
        if (d && d.id && !deletedSquadIds.has(d.id)) {
          cloudSquads.set(d.id, {
            id: d.id,
            name: d.name,
            shortCode: d.shortCode,
            logoUrl: d.logoUrl || undefined,
            player1: d.player1 || undefined,
            player2: d.player2 || undefined,
            learnedTokens: Array.isArray(d.learnedTokens) && d.learnedTokens.length > 0
              ? d.learnedTokens
              : undefined,
            updatedAt: d.updatedAt || 0,
          });
        }
      });

      const localSquads = useTournamentStore.getState().savedSquads;
      const merged = new Map<string, SavedSquadRecord>(cloudSquads);

      for (const lSq of localSquads) {
        if (deletedSquadIds.has(lSq.id)) continue;
        const cSq = cloudSquads.get(lSq.id);
        if (!cSq) {
          if (!initialSquadsSynced) {
            merged.set(lSq.id, lSq);
            void setDoc(
              doc(db, 'user_workspaces', emailLower, 'saved_squads', lSq.id),
              serializeSquadForCloud(lSq)
            ).catch(() => {});
          }
        } else if ((lSq.updatedAt || 0) > (cSq.updatedAt || 0)) {
          merged.set(lSq.id, lSq);
          if (!initialSquadsSynced) {
            void setDoc(
              doc(db, 'user_workspaces', emailLower, 'saved_squads', lSq.id),
              serializeSquadForCloud(lSq)
            ).catch(() => {});
          }
        }
      }

      initialSquadsSynced = true;
      const sorted = Array.from(merged.values()).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      );
      useTournamentStore.getState().applyCloudWorkspace({
        savedSquads: sorted,
      });
    }
  );
}
