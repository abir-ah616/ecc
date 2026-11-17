import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/tournament_models.dart';
import '../state/auth_state.dart';
import '../state/tournament_state.dart';

class CloudSyncService {
  CloudSyncService._();
  static final CloudSyncService instance = CloudSyncService._();

  String? _activeEmail;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _metaSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _tournamentsSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _squadsSub;
  final Map<String, Timer> _tournamentTimers = {};
  Timer? _metaTimer;
  final Set<String> _deletedTournamentIds = {};
  final Set<String> _deletedSquadIds = {};

  Map<String, dynamic> _serializeTournament(TournamentRecord t) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final json = t.toJson();
    return {
      'id': t.id.length > 128 ? t.id.substring(0, 128) : t.id,
      'name': (t.name.isEmpty ? 'Tournament' : t.name).length > 200
          ? t.name.substring(0, 200)
          : (t.name.isEmpty ? 'Tournament' : t.name),
      'createdAt': t.createdAt.length > 80
          ? t.createdAt.substring(0, 80)
          : t.createdAt,
      'createdAtTimestamp': t.createdAtTimestamp > 0 ? t.createdAtTimestamp : now,
      'updatedAt': t.updatedAt > 0 ? t.updatedAt : now,
      'settings': json['settings'],
      'teams': (json['teams'] as List).take(64).toList(),
      'matches': (json['matches'] as List).take(64).toList(),
      'isEnded': t.isEnded,
      'championTeamName': t.championTeamName,
      'championScore': t.championScore,
    };
  }

  Map<String, dynamic> _serializeSquad(SavedSquadRecord s) {
    return {
      'id': s.id.length > 128 ? s.id.substring(0, 128) : s.id,
      'name': s.name.length > 120 ? s.name.substring(0, 120) : s.name,
      'shortCode':
          s.shortCode.length > 16 ? s.shortCode.substring(0, 16) : s.shortCode,
      'logoUrl': (s.logoUrl != null && s.logoUrl!.length <= 880000)
          ? s.logoUrl
          : null,
      'player1': (s.player1 ?? '').trim().isEmpty ? null : s.player1!.trim(),
      'player2': (s.player2 ?? '').trim().isEmpty ? null : s.player2!.trim(),
      'players': s.players.isEmpty
          ? null
          : s.players
              .take(12)
              .map((p) => p.length > 120 ? p.substring(0, 120) : p)
              .toList(),
      'learnedTokens': s.learnedTokens.take(40).toList(),
      'updatedAt':
          s.updatedAt > 0 ? s.updatedAt : DateTime.now().millisecondsSinceEpoch,
    };
  }

  Future<void> _pushTournament(
    String emailLower,
    TournamentRecord record,
    TournamentStore store,
  ) async {
    try {
      store.setCloudSyncStatus(CloudSyncStatus.syncing);
      await FirebaseFirestore.instance
          .collection('user_workspaces')
          .doc(emailLower)
          .collection('tournaments')
          .doc(record.id)
          .set(_serializeTournament(record));
      store.setCloudSyncStatus(CloudSyncStatus.synced);
    } catch (_) {
      store.setCloudSyncStatus(CloudSyncStatus.offline);
    }
  }

  Future<void> _pushMeta(String emailLower, TournamentStore store) async {
    try {
      await FirebaseFirestore.instance
          .collection('user_workspaces')
          .doc(emailLower)
          .set({
        'email': emailLower,
        'activeTournamentId': store.activeTournamentId,
        'defaultPointSystem': store.defaultPointSystem.toJson(),
        'organizerDefaults': store.organizerDefaults.toJson(),
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      }, SetOptions(merge: true));
    } catch (_) {}
  }

  void stop(TournamentStore store) {
    _activeEmail = null;
    _metaSub?.cancel();
    _tournamentsSub?.cancel();
    _squadsSub?.cancel();
    _metaSub = null;
    _tournamentsSub = null;
    _squadsSub = null;
    for (final t in _tournamentTimers.values) {
      t.cancel();
    }
    _tournamentTimers.clear();
    _metaTimer?.cancel();
    _metaTimer = null;
    store.registerCloudSyncHooks(const MobileCloudSyncHooks());
    store.setCloudSyncStatus(CloudSyncStatus.idle);
  }

  void start(String rawEmail, TournamentStore store) {
    final emailLower = normalizeEmail(rawEmail);
    if (emailLower.isEmpty || _activeEmail == emailLower) return;

    stop(store);
    _activeEmail = emailLower;
    store.setCloudSyncStatus(CloudSyncStatus.syncing);

    bool initialTournamentsSynced = false;
    bool initialSquadsSynced = false;
    final db = FirebaseFirestore.instance;
    final wsRef = db.collection('user_workspaces').doc(emailLower);

    store.registerCloudSyncHooks(
      MobileCloudSyncHooks(
        onTournamentUpsert: (record) {
          if (_activeEmail != emailLower) return;
          _deletedTournamentIds.remove(record.id);
          _tournamentTimers[record.id]?.cancel();
          _tournamentTimers[record.id] = Timer(
            const Duration(milliseconds: 420),
            () {
              _tournamentTimers.remove(record.id);
              if (_activeEmail != emailLower) return;
              TournamentRecord? latest;
              for (final t in store.tournaments) {
                if (t.id == record.id) {
                  latest = t;
                  break;
                }
              }
              if (latest != null) {
                _pushTournament(emailLower, latest, store);
              }
            },
          );
        },
        onTournamentDelete: (id) {
          if (_activeEmail != emailLower) return;
          _deletedTournamentIds.add(id);
          _tournamentTimers.remove(id)?.cancel();
          wsRef.collection('tournaments').doc(id).delete().catchError((_) {});
        },
        onSquadsUpsert: (squads) {
          if (_activeEmail != emailLower) return;
          for (final s in squads) {
            _deletedSquadIds.remove(s.id);
            wsRef
                .collection('saved_squads')
                .doc(s.id)
                .set(_serializeSquad(s))
                .catchError((_) {});
          }
        },
        onSquadDelete: (id) {
          if (_activeEmail != emailLower) return;
          _deletedSquadIds.add(id);
          wsRef.collection('saved_squads').doc(id).delete().catchError((_) {});
        },
        onMetaUpdate: () {
          if (_activeEmail != emailLower) return;
          _metaTimer?.cancel();
          _metaTimer = Timer(const Duration(milliseconds: 450), () {
            if (_activeEmail == emailLower) {
              _pushMeta(emailLower, store);
            }
          });
        },
      ),
    );

    _metaSub = wsRef.snapshots().listen(
      (snap) {
        if (!snap.exists || snap.data() == null) {
          _pushMeta(emailLower, store);
          return;
        }
        final data = snap.data()!;
        final ptSys = data['defaultPointSystem'] is Map<String, dynamic>
            ? PointSystemConfig.fromJson(
                data['defaultPointSystem'] as Map<String, dynamic>,
              )
            : null;
        final defaults = data['organizerDefaults'] is Map<String, dynamic>
            ? OrganizerDefaults.fromJson(
                data['organizerDefaults'] as Map<String, dynamic>,
              )
            : null;
        final activeId = data['activeTournamentId'] as String?;
        store.applyCloudWorkspace(
          defaultPointSystem: ptSys,
          organizerDefaults: defaults,
          activeTournamentId: activeId,
          updateActiveId: activeId != null,
        );
      },
      onError: (_) => store.setCloudSyncStatus(CloudSyncStatus.offline),
    );

    _tournamentsSub = wsRef.collection('tournaments').snapshots().listen(
      (snap) {
        final cloudMap = <String, TournamentRecord>{};
        for (final docSnap in snap.docs) {
          try {
            final rec = TournamentRecord.fromJson(docSnap.data());
            if (!_deletedTournamentIds.contains(rec.id)) {
              cloudMap[rec.id] = rec;
            }
          } catch (_) {}
        }

        final merged = <String, TournamentRecord>{...cloudMap};
        for (final local in store.tournaments) {
          if (_deletedTournamentIds.contains(local.id)) continue;
          final cloud = cloudMap[local.id];
          if (cloud == null) {
            if (!initialTournamentsSynced ||
                _tournamentTimers.containsKey(local.id)) {
              merged[local.id] = local;
              _pushTournament(emailLower, local, store);
            }
          } else if (local.updatedAt > cloud.updatedAt) {
            merged[local.id] = local;
            if (!initialTournamentsSynced) {
              _pushTournament(emailLower, local, store);
            }
          }
        }

        initialTournamentsSynced = true;
        final sorted = merged.values.toList()
          ..sort(
              (a, b) => b.createdAtTimestamp.compareTo(a.createdAtTimestamp));
        store.applyCloudWorkspace(
          tournaments: sorted,
          updateActiveId: true,
        );
        store.setCloudSyncStatus(CloudSyncStatus.synced);
      },
      onError: (_) => store.setCloudSyncStatus(CloudSyncStatus.offline),
    );

    _squadsSub = wsRef.collection('saved_squads').snapshots().listen((snap) {
      final cloudMap = <String, SavedSquadRecord>{};
      for (final docSnap in snap.docs) {
        try {
          final sq = SavedSquadRecord.fromJson(docSnap.data());
          if (sq.id.isNotEmpty && !_deletedSquadIds.contains(sq.id)) {
            cloudMap[sq.id] = sq;
          }
        } catch (_) {}
      }

      final merged = <String, SavedSquadRecord>{...cloudMap};
      for (final local in store.savedSquads) {
        if (_deletedSquadIds.contains(local.id)) continue;
        final cloud = cloudMap[local.id];
        if (cloud == null) {
          if (!initialSquadsSynced) {
            merged[local.id] = local;
            wsRef
                .collection('saved_squads')
                .doc(local.id)
                .set(_serializeSquad(local))
                .catchError((_) {});
          }
        } else if (local.updatedAt > cloud.updatedAt) {
          merged[local.id] = local;
          if (!initialSquadsSynced) {
            wsRef
                .collection('saved_squads')
                .doc(local.id)
                .set(_serializeSquad(local))
                .catchError((_) {});
          }
        }
      }

      initialSquadsSynced = true;
      final sorted = merged.values.toList()
        ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      store.applyCloudWorkspace(savedSquads: sorted);
    });
  }
}
