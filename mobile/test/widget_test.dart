import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:esp_calc_mobile/main.dart';
import 'package:esp_calc_mobile/models/tournament_models.dart';
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

    expect(find.text('ESP CALC'), findsOneWidget);
    expect(find.text('Mobile Standings Studio'), findsOneWidget);
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

    await tester.tap(find.text('Crimson'));
    await tester.pumpAndSettle();
    expect(store.activeTournament?.settings.theme.name, 'crimson');

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
}
