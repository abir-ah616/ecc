import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/scoring.dart';
import '../../theme/app_theme.dart';

class AmbientBackdrop extends StatelessWidget {
  final Color accentColor;
  final double intensity;

  const AmbientBackdrop({
    super.key,
    required this.accentColor,
    this.intensity = 0.09,
  });

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: RepaintBoundary(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeOutCubic,
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const Alignment(-0.45, -0.95),
              radius: 1.15,
              colors: [
                accentColor.withValues(alpha: intensity),
                accentColor.withValues(alpha: intensity * 0.25),
                Colors.transparent,
              ],
              stops: const [0.0, 0.42, 0.88],
            ),
          ),
        ),
      ),
    );
  }
}

class TactileCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final Color? backgroundColor;
  final Color? borderColor;
  final double borderRadius;
  final bool elevated;

  const TactileCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(16),
    this.backgroundColor,
    this.borderColor,
    this.borderRadius = 20,
    this.elevated = false,
  });

  @override
  State<TactileCard> createState() => _TactileCardState();
}

class _TactileCardState extends State<TactileCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final baseColor = widget.backgroundColor ?? AppColors.surface;
    final topTint = widget.backgroundColor != null
        ? Color.lerp(baseColor, Colors.white, 0.025)!
        : (widget.elevated ? const Color(0xFF181D28) : AppColors.surfaceTop);

    final content = Container(
      padding: widget.padding,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: _pressed ? [baseColor, baseColor] : [topTint, baseColor],
        ),
        borderRadius: BorderRadius.circular(widget.borderRadius),
        border: Border.all(
          color: widget.borderColor ??
              (widget.elevated
                  ? AppColors.borderStrong
                  : AppColors.borderSubtle),
        ),
        boxShadow: widget.elevated
            ? const [
                BoxShadow(
                  color: Color(0x3D000000),
                  blurRadius: 14,
                  offset: Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: widget.child,
    );

    if (widget.onTap == null) return content;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: () {
        HapticFeedback.selectionClick();
        widget.onTap?.call();
      },
      child: AnimatedScale(
        scale: _pressed ? 0.985 : 1.0,
        duration: const Duration(milliseconds: 95),
        curve: Curves.easeOut,
        child: content,
      ),
    );
  }
}

class PrimaryPillButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool expand;
  final EdgeInsetsGeometry? padding;
  final Color? accentColor;
  final Color? foregroundColor;

  const PrimaryPillButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.isLoading = false,
    this.expand = false,
    this.padding,
    this.accentColor,
    this.foregroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final bg = accentColor ?? AppColors.accent;
    final fg = foregroundColor ?? AppColors.inkOnAccent;
    final enabled = !isLoading && onPressed != null;

    final button = Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        boxShadow: enabled
            ? [
                BoxShadow(
                  color: bg.withValues(alpha: 0.22),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: FilledButton(
        onPressed: !enabled
            ? null
            : () {
                HapticFeedback.lightImpact();
                onPressed!();
              },
        style: FilledButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: bg.withValues(alpha: 0.35),
          disabledForegroundColor: fg.withValues(alpha: 0.7),
          padding: padding ??
              const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
          shape: const StadiumBorder(),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.1,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  color: fg,
                ),
              )
            : Row(
                mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
      ),
    );

    if (!expand) return button;
    return SizedBox(width: double.infinity, child: button);
  }
}

class SecondaryPillButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final Color? textColor;
  final Color? borderColor;
  final bool expand;

  const SecondaryPillButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.textColor,
    this.borderColor,
    this.expand = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = OutlinedButton(
      onPressed: onPressed == null
          ? null
          : () {
              HapticFeedback.selectionClick();
              onPressed!();
            },
      style: OutlinedButton.styleFrom(
        backgroundColor: AppColors.surfaceElevated,
        foregroundColor: textColor ?? AppColors.textPrimary,
        side: BorderSide(color: borderColor ?? AppColors.borderStrong),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
        ),
      ),
      child: Row(
        mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16),
            const SizedBox(width: 7),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );

    if (!expand) return child;
    return SizedBox(width: double.infinity, child: child);
  }
}

class StatusPill extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;
  final IconData? icon;

  const StatusPill({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: ShapeDecoration(
        color: backgroundColor,
        shape: StadiumBorder(side: BorderSide(color: borderColor)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: textColor),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class SquadBadge extends StatelessWidget {
  final String teamName;
  final String? shortCode;
  final String? logoUrl;
  final double size;
  final bool highlight;

  static final Map<String, Uint8List> _decodedLogoCache = {};

  const SquadBadge({
    super.key,
    required this.teamName,
    this.shortCode,
    this.logoUrl,
    this.size = 40,
    this.highlight = false,
  });

  Uint8List? _decodeDataUrl(String? raw) {
    if (raw == null || !raw.startsWith('data:image')) return null;
    final cached = _decodedLogoCache[raw];
    if (cached != null) return cached;
    final comma = raw.indexOf(',');
    if (comma == -1) return null;
    try {
      final decoded = base64Decode(raw.substring(comma + 1));
      if (_decodedLogoCache.length > 120) {
        _decodedLogoCache.remove(_decodedLogoCache.keys.first);
      }
      _decodedLogoCache[raw] = decoded;
      return decoded;
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bytes = _decodeDataUrl(logoUrl);
    final initials = (shortCode != null && shortCode!.trim().isNotEmpty)
        ? shortCode!.trim()
        : generateTeamInitials(teamName);
    final radius = BorderRadius.circular(size * 0.3);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: highlight ? AppColors.accentSurface : AppColors.inputFill,
        borderRadius: radius,
      ),
      foregroundDecoration: BoxDecoration(
        borderRadius: radius,
        border: Border.all(
          color: highlight ? AppColors.accentBorder : AppColors.borderStrong,
        ),
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: bytes != null
            ? Padding(
                padding: const EdgeInsets.all(3),
                child: Image.memory(
                  bytes,
                  fit: BoxFit.contain,
                  gaplessPlayback: true,
                  cacheWidth: (size * 2.5).round(),
                  filterQuality: FilterQuality.medium,
                ),
              )
            : Center(
                child: Text(
                  initials,
                  style: TextStyle(
                    color: highlight
                        ? AppColors.accentBright
                        : AppColors.textPrimary,
                    fontSize: size * 0.3,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
      ),
    );
  }
}

class SheetHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const SheetHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 10),
        Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: AppColors.borderStrong,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
        const Divider(),
      ],
    );
  }
}

class SegmentedToggle<T> extends StatelessWidget {
  final List<({T value, String label, IconData? icon})> items;
  final T selected;
  final ValueChanged<T> onChanged;
  final Color? accentColor;

  const SegmentedToggle({
    super.key,
    required this.items,
    required this.selected,
    required this.onChanged,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final count = items.isEmpty ? 1 : items.length;
    final activeIndex = items.indexWhere((e) => e.value == selected);
    final safeIndex = activeIndex < 0 ? 0 : activeIndex;
    final alignmentX =
        count == 1 ? 0.0 : -1.0 + (2.0 * safeIndex / (count - 1));
    final resolvedAccent = accentColor ?? AppColors.accentBright;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.inputFill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: AnimatedAlign(
              alignment: Alignment(alignmentX, 0),
              duration: const Duration(milliseconds: 210),
              curve: Curves.easeOutCubic,
              child: FractionallySizedBox(
                widthFactor: 1 / count,
                heightFactor: 1,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF212634), AppColors.surfaceElevated],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.borderStrong),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x40000000),
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Row(
            children: items.map((item) {
              final active = item.value == selected;
              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    if (!active) {
                      HapticFeedback.selectionClick();
                      onChanged(item.value);
                    }
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (item.icon != null) ...[
                          TweenAnimationBuilder<Color?>(
                            tween: ColorTween(
                              end: active
                                  ? resolvedAccent
                                  : AppColors.textSecondary,
                            ),
                            duration: const Duration(milliseconds: 160),
                            builder: (_, color, __) => Icon(
                              item.icon,
                              size: 15,
                              color: color,
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Flexible(
                          child: AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 160),
                            style: TextStyle(
                              color: active
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                              fontSize: 13,
                              fontWeight:
                                  active ? FontWeight.w800 : FontWeight.w600,
                            ),
                            child: Text(
                              item.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

/// Bespoke geometric broadcast emblem for ESP CALC (chamfered obsidian crest
/// with precision angled monogram).
class EspCalcLogoMark extends StatelessWidget {
  final double size;
  final Color accentColor;

  const EspCalcLogoMark({
    super.key,
    this.size = 40,
    this.accentColor = AppColors.accent,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        size: Size.square(size),
        painter: _EspCalcLogoPainter(accentColor: accentColor),
      ),
    );
  }
}

class _EspCalcLogoPainter extends CustomPainter {
  final Color accentColor;

  const _EspCalcLogoPainter({required this.accentColor});

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final h = size.height;

    // Outer chamfered octagonal shield
    final shield = Path()
      ..moveTo(s * 0.22, h * 0.05)
      ..lineTo(s * 0.78, h * 0.05)
      ..lineTo(s * 0.95, h * 0.22)
      ..lineTo(s * 0.95, h * 0.72)
      ..lineTo(s * 0.75, h * 0.95)
      ..lineTo(s * 0.25, h * 0.95)
      ..lineTo(s * 0.05, h * 0.72)
      ..lineTo(s * 0.05, h * 0.22)
      ..close();

    final bgPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1D2434), Color(0xFF0B0E15)],
      ).createShader(Rect.fromLTWH(0, 0, s, h));
    canvas.drawPath(shield, bgPaint);

    // Subtle top-left metallic accent wash
    final washPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.5, -0.75),
        radius: 1.0,
        colors: [
          accentColor.withValues(alpha: 0.24),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, s, h));
    canvas.drawPath(shield, washPaint);

    // Outer & inner double chamfer bevel matching app launcher emblem
    final outerBorderPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = s * 0.036
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color.lerp(accentColor, Colors.white, 0.28)!,
          accentColor.withValues(alpha: 0.45),
          accentColor.withValues(alpha: 0.85),
        ],
      ).createShader(Rect.fromLTWH(0, 0, s, h));
    canvas.drawPath(shield, outerBorderPaint);

    final innerShield = Path()
      ..moveTo(s * 0.26, h * 0.12)
      ..lineTo(s * 0.74, h * 0.12)
      ..lineTo(s * 0.88, h * 0.26)
      ..lineTo(s * 0.88, h * 0.69)
      ..lineTo(s * 0.71, h * 0.88)
      ..lineTo(s * 0.29, h * 0.88)
      ..lineTo(s * 0.12, h * 0.69)
      ..lineTo(s * 0.12, h * 0.26)
      ..close();
    canvas.drawPath(
      innerShield,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = s * 0.018
        ..color = accentColor.withValues(alpha: 0.35),
    );

    // Bright highlight gradient for the angled geometric monogram
    final brightAccent = Color.lerp(accentColor, Colors.white, 0.46)!;
    final glyphShader = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [brightAccent, accentColor, Color.lerp(accentColor, const Color(0xFFEA580C), 0.35)!],
    ).createShader(Rect.fromLTWH(s * 0.25, h * 0.24, s * 0.5, h * 0.52));
    final glyphPaint = Paint()..shader = glyphShader;

    // Angled left spine + top/bottom tactical blades ("E" broadcast mark)
    final topBlade = Path()
      ..moveTo(s * 0.30, h * 0.27)
      ..lineTo(s * 0.73, h * 0.27)
      ..lineTo(s * 0.67, h * 0.38)
      ..lineTo(s * 0.39, h * 0.38)
      ..lineTo(s * 0.39, h * 0.62)
      ..lineTo(s * 0.69, h * 0.62)
      ..lineTo(s * 0.75, h * 0.73)
      ..lineTo(s * 0.26, h * 0.73)
      ..lineTo(s * 0.26, h * 0.31)
      ..close();
    canvas.drawPath(topBlade, glyphPaint);

    // Precision middle pulse bar
    final midBar = Path()
      ..moveTo(s * 0.44, h * 0.445)
      ..lineTo(s * 0.66, h * 0.445)
      ..lineTo(s * 0.61, h * 0.555)
      ..lineTo(s * 0.44, h * 0.555)
      ..close();
    canvas.drawPath(midBar, glyphPaint);
  }

  @override
  bool shouldRepaint(covariant _EspCalcLogoPainter oldDelegate) =>
      oldDelegate.accentColor != accentColor;
}

class OrganizerAvatar extends StatelessWidget {
  final String initial;
  final String? photoUrl;
  final double size;
  final bool showRing;
  final bool showCrown;

  const OrganizerAvatar({
    super.key,
    required this.initial,
    this.photoUrl,
    this.size = 26,
    this.showRing = false,
    this.showCrown = false,
  });

  @override
  Widget build(BuildContext context) {
    final safeInitial =
        initial.trim().isNotEmpty ? initial.trim().substring(0, 1).toUpperCase() : 'O';
    final hasUrl = photoUrl != null && photoUrl!.trim().isNotEmpty;

    final circle = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        shape: BoxShape.circle,
        border: showRing
            ? Border.all(
                color: const Color(0xFFA855F7).withValues(alpha: 0.75),
                width: 1.6,
              )
            : null,
        boxShadow: showRing
            ? [
                BoxShadow(
                  color: const Color(0xFFA855F7).withValues(alpha: 0.32),
                  blurRadius: 12,
                ),
              ]
            : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        alignment: Alignment.center,
        fit: StackFit.expand,
        children: [
          Center(
            child: Text(
              safeInitial,
              style: TextStyle(
                color: AppColors.accentBright,
                fontSize: size * 0.42,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          if (hasUrl)
            Image.network(
              photoUrl!.trim(),
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
        ],
      ),
    );

    if (!showCrown) return circle;

    return SizedBox(
      width: size + 4,
      height: size + 4,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Align(alignment: Alignment.center, child: circle),
          Positioned(
            right: -1,
            bottom: -1,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFBBF24), Color(0xFFD97706)],
                ),
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.canvas, width: 1.5),
              ),
              child: const Icon(
                Icons.workspace_premium_rounded,
                size: 10,
                color: Color(0xFF090B0F),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
