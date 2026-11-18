import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:esp_calc_mobile/main.dart';
import 'package:esp_calc_mobile/models/tournament_models.dart';
import 'package:esp_calc_mobile/services/poster_server.dart';
import 'package:esp_calc_mobile/state/auth_state.dart';
import 'package:esp_calc_mobile/state/tournament_state.dart';
import 'package:esp_calc_mobile/theme/app_theme.dart';
import 'package:esp_calc_mobile/ui/screens/poster_screen.dart';

class _FakeSignedOutAuthStore extends AuthStore {
  @override
  bool get isLoading => false;

  @override
  bool get isFirebaseReady => true;

  @override
  bool get isAllowed => false;

  @override
  Future<void> initialize() async {}
}

class _FakeOrganizerAuthStore extends AuthStore {
  @override
  bool get isLoading => false;

  @override
  bool get isFirebaseReady => true;

  @override
  bool get isAllowed => true;

  @override
  bool get isAdmin => false;

  @override
  Future<void> initialize() async {}
}

class _FakeTamperedAuthStore extends AuthStore {
  @override
  bool get isLoading => false;

  @override
  bool get isFirebaseReady => true;

  @override
  bool get isAllowed => true;

  @override
  bool get integrityTrusted => false;

  @override
  String? get integrityError =>
      'Security verification failed (signature-mismatch).';

  @override
  Future<void> initialize() async {}
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('renders matte-dark Google Login gate when signed out',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();
    final auth = _FakeSignedOutAuthStore();

    await tester.pumpWidget(
      EspCalcApp(
        authStoreOverride: auth,
        tournamentStoreOverride: store,
        skipAutoInit: true,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('EspCalc'), findsOneWidget);
    expect(find.text('BROADCAST STUDIO'), findsOneWidget);
    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.byType(MaterialApp), findsOneWidget);
  });

  testWidgets(
      'organizer shell creates Champion Rush tournament with 5,6,7,8,10 pills and navigates tabs',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();
    final auth = _FakeOrganizerAuthStore();

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark(),
        home: AnimatedBuilder(
          animation: store,
          builder: (_, __) => OrganizerShell(
            authStore: auth,
            tournamentStore: store,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Create Tournament'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Ready for Match Day'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Ready for Match Day'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Create Tournament'),
      -200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Create Tournament'));
    await tester.pumpAndSettle();

    expect(find.text('New Tournament'), findsOneWidget);
    await tester.tap(find.text('Champion Rush'));
    await tester.pumpAndSettle();

    for (final ceiling in ['5', '6', '7', '8', '10']) {
      expect(find.text(ceiling), findsWidgets);
    }

    final verticalList = find
        .byWidgetPredicate(
          (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
        )
        .first;

    await tester.scrollUntilVisible(
      find.text('Continue to Squads'),
      250,
      scrollable: verticalList,
    );
    await tester.tap(find.text('Continue to Squads'));
    await tester.pumpAndSettle();

    expect(find.text('Step 2 of 2 · Squads & Branding'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Launch Tournament'),
      300,
      scrollable: find
          .byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          )
          .first,
    );
    await tester.tap(find.text('Launch Tournament'));
    await tester.pumpAndSettle();

    expect(store.tournaments.length, 1);
    expect(find.text('Scorecard'), findsOneWidget);
    expect(find.text('Standings'), findsOneWidget);

    await tester.tap(find.text('History').last);
    await tester.pumpAndSettle();
    expect(find.text('Search tournaments or squads...'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.photo_library_rounded));
    await tester.pumpAndSettle();
    expect(find.text('Poster Studio'), findsOneWidget);

    await tester.tap(find.text('Scarlet Strike'));
    await tester.pumpAndSettle();
    expect(store.activeTournament?.settings.theme.name, 'scarlet');

    final posterList = find
        .descendant(
          of: find.byType(PosterScreen),
          matching: find.byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          ),
        )
        .first;
    await tester.scrollUntilVisible(
      find.text('Save PNG'),
      250,
      scrollable: posterList,
    );
    await tester.pumpAndSettle();

    final saveRect = tester.getRect(find.text('Save PNG'));
    final dockRect = tester.getRect(find.byIcon(Icons.home_rounded));
    expect(saveRect.bottom, lessThan(dockRect.top));

    await tester.tap(find.text('Squad Logos: On'));
    await tester.pumpAndSettle();
    expect(store.activeTournament?.settings.showLogos, false);

    await tester.tap(find.byIcon(Icons.home_rounded));
    await tester.pumpAndSettle();
    expect(find.text('Create Tournament'), findsOneWidget);
    expect(find.text('Poster Studio'), findsOneWidget);
    expect(find.text('Score System'), findsOneWidget);
    expect(find.text('Templates'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('LIVE'), findsOneWidget);
    expect(find.text('Recent Projects'), findsOneWidget);
    expect(find.text('View All'), findsOneWidget);
    expect(find.text('STANDINGS'), findsNothing);
    await tester.scrollUntilVisible(
      find.text('MADE BY MR. OPPY'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('MADE BY MR. OPPY'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('LIVE'),
      -200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('LIVE'));
    await tester.pumpAndSettle();
    expect(find.text('Scorecard'), findsOneWidget);

    final completeRect = tester.getRect(find.text('Complete Match 1'));
    final matchesDockRect = tester.getRect(find.byIcon(Icons.home_rounded));
    expect(completeRect.bottom, lessThan(matchesDockRect.top));
  });

  testWidgets(
      'sticky match completion buttons remain clear of bottom dock with 3-button Android inset',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();
    store.createTournament(
      name: 'Test Cup',
      mode: TournamentMode.scrim,
      squadInputs: [
        for (int i = 1; i <= 12; i++) (name: 'Team $i', logoUrl: null),
      ],
    );
    final auth = _FakeOrganizerAuthStore();

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(
          size: Size(360, 800),
          padding: EdgeInsets.only(top: 24, bottom: 48),
        ),
        child: MaterialApp(
          theme: AppTheme.dark(),
          home: OrganizerShell(
            authStore: auth,
            tournamentStore: store,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.scoreboard_rounded));
    await tester.pumpAndSettle();

    final completeRect = tester.getRect(find.text('Complete Match 1'));
    final dockRect = tester.getRect(find.byIcon(Icons.home_rounded));
    expect(completeRect.bottom, lessThan(dockRect.top));
  });

  testWidgets('blocks app access when integrityTrusted is false',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();
    final auth = _FakeTamperedAuthStore();

    await tester.pumpWidget(
      EspCalcApp(
        authStoreOverride: auth,
        tournamentStoreOverride: store,
        skipAutoInit: true,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Security Check Failed'), findsOneWidget);
    expect(find.text('Create Tournament'), findsNothing);
    expect(find.text('Continue with Google'), findsNothing);
  });

  test('sanitizes unsafe URLs in importJson and rejects non-local poster URIs',
      () async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();

    final ok = store.importJson(jsonEncode({
      'activeTournamentId': 't1',
      'tournaments': [
        {
          'id': 't1',
          'name': 'Cup',
          'settings': {
            'mode': 'SCRIM',
            'name': 'Cup',
            'roundOrDay': 'FINALS',
            'hostLogoUrl': 'javascript:alert(1)',
            'sponsorLogoUrl': 'https://cdn.example.com/s.png',
            'customLogoUrl': 'data:image/svg+xml;base64,PHN2Zz4=',
            'totalMatchesPlanned': 5,
            'teamCount': 1,
          },
          'teams': [
            {
              'id': 'tm1',
              'name': 'Squad 1',
              'logoUrl': 'data:text/html,<script>1</script>',
            },
          ],
          'matches': [],
          'isEnded': false,
        },
      ],
    }));

    expect(ok, isTrue);
    final active = store.activeTournament!;
    expect(active.settings.hostLogoUrl, isNull);
    expect(active.settings.customLogoUrl, isNull);
    expect(active.settings.sponsorLogoUrl, 'https://cdn.example.com/s.png');
    expect(active.teams.first.logoUrl, isNull);

    expect(
      LocalPosterAssetServer.instance
          .isAllowedPosterUri(Uri.parse('https://evil.example.com/index.html')),
      isFalse,
    );
  });

  testWidgets(
      'Full-screen blurred Rapid overlay (Booyah -> Total Kills? -> Reverse/Redo -> Standings) & Team List work end-to-end',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();
    store.createTournament(
      name: 'Fast Lobby',
      mode: TournamentMode.scrim,
      squadInputs: const [
        (name: 'Squad Alpha', logoUrl: null),
        (name: 'Squad Bravo', logoUrl: null),
        (name: 'Squad Charlie', logoUrl: null),
      ],
    );
    final auth = _FakeOrganizerAuthStore();

    tester.view.physicalSize = const Size(412, 915);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark(),
        home: AnimatedBuilder(
          animation: store,
          builder: (_, __) => OrganizerShell(
            authStore: auth,
            tournamentStore: store,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.scoreboard_rounded));
    await tester.pumpAndSettle();

    expect(find.text('Rapid'), findsOneWidget);
    expect(find.text('SLOT · SQUAD'), findsOneWidget);

    await tester.tap(find.text('Rapid'));
    await tester.pumpAndSettle();

    Finder inRapid(Finder inner) => find.descendant(
          of: find.byKey(const Key('rapid-fullscreen-overlay')),
          matching: inner,
        );

    expect(inRapid(find.text('#1 Team')), findsOneWidget);
    expect(inRapid(find.text('Which team took Booyah?')), findsOneWidget);

    // Select Squad Alpha -> Total Kills? pops up
    await tester.tap(inRapid(find.text('Squad Alpha')));
    await tester.pumpAndSettle();
    expect(inRapid(find.text('Total Kills?')), findsOneWidget);
    expect(store.activeTournament!.matches.first.entries.values
        .firstWhere((e) => e.placement == 1)
        .teamId, store.activeTournament!.teams[0].id);

    // Enter 12 kills on keypad, then advance to 2nd place
    await tester.tap(inRapid(find.text('1')));
    await tester.tap(inRapid(find.text('2')));
    await tester.pumpAndSettle();
    await tester.tap(inRapid(find.text('Next · 2nd')));
    await tester.pumpAndSettle();
    expect(
      store.activeTournament!.matches.first.entries[store.activeTournament!.teams[0].id]?.kills,
      12,
    );
    expect(inRapid(find.text('Which team placed 2nd?')), findsOneWidget);

    // Reverse goes back to Total Kills? for Squad Alpha (12 kills preserved)
    await tester.tap(inRapid(find.text('Reverse')));
    await tester.pumpAndSettle();
    expect(inRapid(find.text('Total Kills?')), findsOneWidget);
    expect(inRapid(find.text('12')), findsOneWidget);

    // Reverse again returns to Booyah selection and clears placement
    await tester.tap(inRapid(find.text('Reverse')));
    await tester.pumpAndSettle();
    expect(inRapid(find.text('Which team took Booyah?')), findsOneWidget);
    expect(
      store.activeTournament!.matches.first.entries[store.activeTournament!.teams[0].id]?.placement,
      isNull,
    );

    // Redo x2 restores #1 (12 kills) and advances to 2nd pick
    await tester.tap(inRapid(find.text('Redo')));
    await tester.pumpAndSettle();
    await tester.tap(inRapid(find.text('Redo')));
    await tester.pumpAndSettle();
    expect(inRapid(find.text('Which team placed 2nd?')), findsOneWidget);

    // Pick 2nd (Bravo, 5 kills) -> automatically loads sole 3rd team (Charlie) into Total Kills?
    await tester.tap(inRapid(find.text('Squad Bravo')));
    await tester.pumpAndSettle();
    await tester.tap(inRapid(find.text('5')));
    await tester.pumpAndSettle();
    await tester.tap(inRapid(find.text('Next · 3rd')));
    await tester.pumpAndSettle();
    expect(inRapid(find.text('#3')), findsOneWidget);
    expect(inRapid(find.text('Total Kills?')), findsOneWidget);

    // Enter 3 kills for 3rd place and Done -> closes overlay and switches to Standings
    await tester.tap(inRapid(find.text('3')));
    await tester.pumpAndSettle();
    await tester.tap(inRapid(find.text('Done · View Standings')));
    await tester.pumpAndSettle();

    final finalEntries = store.activeTournament!.matches.first.entries;
    expect(finalEntries[store.activeTournament!.teams[0].id]?.placement, 1);
    expect(finalEntries[store.activeTournament!.teams[0].id]?.kills, 12);
    expect(finalEntries[store.activeTournament!.teams[1].id]?.placement, 2);
    expect(finalEntries[store.activeTournament!.teams[1].id]?.kills, 5);
    expect(finalEntries[store.activeTournament!.teams[2].id]?.placement, 3);
    expect(finalEntries[store.activeTournament!.teams[2].id]?.kills, 3);

    // Standings view after Rapid also exposes Complete Match 1 without switching back
    expect(find.text('Complete Match 1'), findsOneWidget);

    // Switch back to Scorecard tab and confirm normal Team List is still editable
    await tester.tap(find.text('Scorecard'));
    await tester.pumpAndSettle();
    expect(find.text('SLOT · SQUAD'), findsOneWidget);
  });

  testWidgets(
      'Full-screen Rapid overlay renders cleanly in short landscape viewport without overflow',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final store = TournamentStore();
    await store.hydrate();
    store.createTournament(
      name: 'Landscape Cup',
      mode: TournamentMode.scrim,
      squadInputs: [
        for (int i = 1; i <= 12; i++) (name: 'Squad $i', logoUrl: null),
      ],
    );
    final auth = _FakeOrganizerAuthStore();

    tester.view.physicalSize = const Size(840, 360);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark(),
        home: AnimatedBuilder(
          animation: store,
          builder: (_, __) => OrganizerShell(
            authStore: auth,
            tournamentStore: store,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.scoreboard_rounded));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Rapid'));
    await tester.pumpAndSettle();

    Finder inRapid(Finder inner) => find.descendant(
          of: find.byKey(const Key('rapid-fullscreen-overlay')),
          matching: inner,
        );

    expect(inRapid(find.text('#1 Team')), findsOneWidget);
    expect(inRapid(find.text('Which team took Booyah?')), findsOneWidget);

    await tester.tap(inRapid(find.text('Squad 1')));
    await tester.pumpAndSettle();

    expect(inRapid(find.text('Total Kills?')), findsOneWidget);
    expect(inRapid(find.text('Next · 2nd')), findsOneWidget);

    await tester.tap(inRapid(find.text('8')));
    await tester.pumpAndSettle();
    await tester.tap(inRapid(find.text('Next · 2nd')));
    await tester.pumpAndSettle();

    expect(
      store.activeTournament!.matches.first.entries[store.activeTournament!.teams[0].id]?.placement,
      1,
    );
    expect(
      store.activeTournament!.matches.first.entries[store.activeTournament!.teams[0].id]?.kills,
      8,
    );
  });
}
