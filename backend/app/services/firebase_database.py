import os
import threading
from typing import Any


ANALYTICS_ROOT = "steam_review_analytics/v1"
FIREBASE_APP_NAME = "dprf_backend"
_app: Any = None
_app_lock = threading.Lock()


class FirebaseBackendError(RuntimeError):
    pass


def _get_firebase_app() -> Any:
    global _app

    if _app is not None:
        return _app

    with _app_lock:
        if _app is not None:
            return _app

        database_url = os.getenv("FIREBASE_DATABASE_URL", "").strip()
        if not database_url:
            raise FirebaseBackendError(
                "FIREBASE_DATABASE_URL belum dikonfigurasi untuk backend."
            )

        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError as error:
            raise FirebaseBackendError(
                "Firebase Admin SDK belum terpasang."
            ) from error

        try:
            _app = firebase_admin.initialize_app(
                credentials.ApplicationDefault(),
                {"databaseURL": database_url},
                name=FIREBASE_APP_NAME,
            )
        except Exception as error:
            raise FirebaseBackendError(
                "Firebase Admin gagal diinisialisasi. Konfigurasikan "
                "Application Default Credentials atau "
                "GOOGLE_APPLICATION_CREDENTIALS."
            ) from error

    return _app


def get_analytics_data() -> Any:
    return get_analytics_node("")


def get_analytics_node(relative_path: str) -> Any:
    if relative_path.startswith("/") or any(
        part in {".", ".."} for part in relative_path.split("/")
    ):
        raise FirebaseBackendError("Path node Firebase tidak valid.")

    try:
        app = _get_firebase_app()
        from firebase_admin import db

        path = (
            f"{ANALYTICS_ROOT}/{relative_path}"
            if relative_path
            else ANALYTICS_ROOT
        )
        return db.reference(path, app=app).get()
    except ImportError as error:
        raise FirebaseBackendError(
            "Firebase Admin SDK belum terpasang."
        ) from error
    except FirebaseBackendError:
        raise
    except Exception as error:
        raise FirebaseBackendError(
            f"Gagal membaca node Firebase {ANALYTICS_ROOT}"
            f"{'/' + relative_path if relative_path else ''}; periksa "
            "Application Default Credentials dan akses akun backend."
        ) from error
