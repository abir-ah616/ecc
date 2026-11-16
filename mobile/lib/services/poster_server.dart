import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart';

/// Serves bundled offline `assets/poster/*` assets over a local loopback HTTP
/// server so Android & iOS WebViews load ES modules, CSS, and local fonts with
/// proper MIME headers and strict path/extension allowlisting.
class LocalPosterAssetServer {
  LocalPosterAssetServer._();
  static final LocalPosterAssetServer instance = LocalPosterAssetServer._();

  static const Set<String> _allowedExtensions = {
    '.html',
    '.js',
    '.mjs',
    '.css',
    '.woff2',
    '.woff',
    '.ttf',
    '.svg',
    '.png',
    '.webp',
    '.jpg',
    '.jpeg',
    '.json',
  };

  HttpServer? _server;
  int? _port;

  int? get port => _port;

  bool isAllowedPosterUri(Uri uri) {
    if (kIsWeb) return false;
    final p = _port;
    if (p == null) return false;
    return uri.scheme == 'http' &&
        (uri.host == '127.0.0.1' || uri.host == 'localhost') &&
        uri.port == p;
  }

  String? _sanitizeAssetPath(String rawPath) {
    if (rawPath.contains('\\') || rawPath.contains('\u0000')) return null;
    final cleaned = rawPath.isEmpty || rawPath == '/' ? '/index.html' : rawPath;
    if (cleaned.contains('..') || !cleaned.startsWith('/')) return null;
    final segments = cleaned
        .split('/')
        .where((s) => s.isNotEmpty)
        .toList();
    if (segments.isEmpty) return null;
    for (final seg in segments) {
      if (seg == '.' || seg == '..' || seg.startsWith('.')) return null;
    }
    final normalized = '/${segments.join('/')}';
    final lower = normalized.toLowerCase();
    final hasAllowedExt = _allowedExtensions.any(lower.endsWith);
    if (!hasAllowedExt) return null;
    return 'assets/poster$normalized';
  }

  Future<String> ensureStarted() async {
    if (kIsWeb) {
      return 'assets/poster/index.html';
    }
    if (_server != null && _port != null) {
      return 'http://127.0.0.1:$_port/index.html';
    }

    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    _server = server;
    _port = server.port;

    server.listen((HttpRequest request) async {
      try {
        if (request.method != 'GET' && request.method != 'HEAD') {
          request.response.statusCode = HttpStatus.methodNotAllowed;
          await request.response.close();
          return;
        }
        final assetKey = _sanitizeAssetPath(request.uri.path);
        if (assetKey == null) {
          request.response.statusCode = HttpStatus.forbidden;
          request.response.write('Forbidden');
          await request.response.close();
          return;
        }

        final data = await rootBundle.load(assetKey);
        final bytes = data.buffer.asUint8List();

        request.response.statusCode = HttpStatus.ok;
        request.response.headers.set(
          HttpHeaders.contentTypeHeader,
          _mimeForPath(assetKey),
        );
        request.response.headers.set(
          'x-content-type-options',
          'nosniff',
        );
        request.response.headers.set(
          HttpHeaders.cacheControlHeader,
          'no-store',
        );
        request.response.add(bytes);
      } catch (_) {
        request.response.statusCode = HttpStatus.notFound;
        request.response.write('Asset not found');
      } finally {
        await request.response.close();
      }
    });

    return 'http://127.0.0.1:$_port/index.html';
  }

  String _mimeForPath(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
    if (lower.endsWith('.js') || lower.endsWith('.mjs')) {
      return 'application/javascript; charset=utf-8';
    }
    if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
    if (lower.endsWith('.woff2')) return 'font/woff2';
    if (lower.endsWith('.woff')) return 'font/woff';
    if (lower.endsWith('.ttf')) return 'font/ttf';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
    return 'application/octet-stream';
  }

  Future<void> dispose() async {
    await _server?.close(force: true);
    _server = null;
    _port = null;
  }
}
