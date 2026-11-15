import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart';

/// Serves bundled offline `assets/poster/*` assets over a local loopback HTTP
/// server so Android & iOS WebViews load ES modules, CSS, and local fonts with
/// proper MIME headers and zero file:// CORS restrictions.
class LocalPosterAssetServer {
  LocalPosterAssetServer._();
  static final LocalPosterAssetServer instance = LocalPosterAssetServer._();

  HttpServer? _server;
  int? _port;

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
        var reqPath = request.uri.path;
        if (reqPath == '/' || reqPath.isEmpty) {
          reqPath = '/index.html';
        }
        final assetKey = 'assets/poster$reqPath';
        final data = await rootBundle.load(assetKey);
        final bytes = data.buffer.asUint8List();

        request.response.statusCode = HttpStatus.ok;
        request.response.headers.set(
          HttpHeaders.contentTypeHeader,
          _mimeForPath(reqPath),
        );
        request.response.headers.set(
          HttpHeaders.accessControlAllowOriginHeader,
          '*',
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
