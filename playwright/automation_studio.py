# Copyright (c) Microsoft Corporation.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Optional in-page workflow builder for Playwright-controlled pages.

The studio injects a small right-hand panel into a page. Its workflow actions
are executed through Playwright locators (rather than synthetic DOM events),
so normal actionability checks and browser input behavior are preserved.
"""

import inspect
import secrets
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urlsplit

_ACTIONS_WITH_TARGET: Set[str] = {
    "click",
    "double_click",
    "hover",
    "fill",
    "type",
    "clear",
    "press",
    "select",
    "check",
    "uncheck",
    "wait",
    "scroll",
}
_ACTIONS_WITH_TEXT: Set[str] = {"fill", "type", "press", "select"}
_ACTIONS: Set[str] = _ACTIONS_WITH_TARGET | {
    "delay",
    "navigate",
    "screenshot",
}
_TARGET_KINDS: Set[str] = {
    "role",
    "label",
    "placeholder",
    "text",
    "testid",
    "title",
    "css",
}
_WAIT_STATES: Set[str] = {"visible", "hidden", "attached", "detached"}
_MAX_TEXT_LENGTH = 10_000
_MAX_SELECTOR_LENGTH = 2_000


class AutomationStudio:
    """Add an optional automation-builder panel to a Playwright ``Page``.

    The same class supports both APIs::

        # Sync API
        studio = AutomationStudio(page).start()

        # Async API
        studio = AutomationStudio(page)
        await studio.start()

    Use the page object that is already displaying the site. The panel appears
    inside that page, on the right-hand side. It does not launch another browser.

    Args:
        page: A Playwright sync or async ``Page``.
        timeout: Default timeout in milliseconds for an individual action.
        max_steps: Maximum number of actions in one saved workflow.
    """

    def __init__(self, page: Any, *, timeout: int = 10_000, max_steps: int = 100):
        if isinstance(timeout, bool) or not isinstance(timeout, int) or timeout < 1:
            raise ValueError("timeout must be a positive integer in milliseconds")
        if isinstance(max_steps, bool) or not isinstance(max_steps, int) or max_steps < 1:
            raise ValueError("max_steps must be a positive integer")

        self._page = page
        self._page_impl = getattr(page, "_impl_obj", page)
        self._is_async = inspect.iscoroutinefunction(getattr(page, "evaluate", None))
        self._timeout = timeout
        self._max_steps = max_steps
        self._binding_name = f"__pw_automation_studio_{secrets.token_hex(6)}"
        self._bridge_token = secrets.token_urlsafe(24)
        self._host_id = f"pw-automation-studio-{secrets.token_hex(6)}"
        self._binding_handle: Optional[Any] = None
        self._closed = False
        self._stop_requested = False
        self._saved_actions: List[Dict[str, Any]] = []
        self._state: Dict[str, Any] = {
            "status": "ready",
            "current": 0,
            "total": 0,
            "message": "پنل آماده است",
            "error": "",
        }

        asset_path = Path(__file__).parent / "_impl" / "_automation_studio.js"
        try:
            script = asset_path.read_text(encoding="utf-8")
        except OSError as error:
            raise RuntimeError(
                f"Could not read the Automation Studio UI asset: {asset_path}"
            ) from error
        self._init_script = (
            script.replace("__PW_AUTOMATION_STUDIO_BINDING__", self._binding_name)
            .replace("__PW_AUTOMATION_STUDIO_HOST_ID__", self._host_id)
            .replace("__PW_AUTOMATION_STUDIO_TOKEN__", self._bridge_token)
        )

    def start(self) -> Any:
        """Install the panel on the current page and future navigations.

        Returns the studio instance for the sync API. With the async API, await
        this method before interacting with the page.
        """
        if self._closed:
            raise RuntimeError("This AutomationStudio instance has been closed")
        if self._binding_handle is not None:
            return self if not self._is_async else self._start_async()
        if self._is_async:
            return self._start_async()
        return self._start_sync()

    def _start_sync(self) -> "AutomationStudio":
        try:
            self._binding_handle = self._page.expose_binding(
                self._binding_name, self._handle_message
            )
            self._page.add_init_script(script=self._init_script)
            if self._has_current_content_sync():
                self._page.evaluate(self._init_script)
        except Exception:
            self._dispose_sync_binding()
            raise
        return self

    async def _start_async(self) -> "AutomationStudio":
        if self._binding_handle is not None:
            return self
        try:
            self._binding_handle = await self._page.expose_binding(
                self._binding_name, self._handle_message
            )
            await self._page.add_init_script(script=self._init_script)
            if await self._has_current_content_async():
                await self._page.evaluate(self._init_script)
        except Exception:
            await self._dispose_async_binding()
            raise
        return self

    def _has_current_content_sync(self) -> bool:
        if self._page_impl.url != "about:blank":
            return True
        return bool(
            self._page.evaluate(
                "() => Boolean(document.body && document.body.childElementCount)"
            )
        )

    async def _has_current_content_async(self) -> bool:
        if self._page_impl.url != "about:blank":
            return True
        return bool(
            await self._page.evaluate(
                "() => Boolean(document.body && document.body.childElementCount)"
            )
        )

    def close(self) -> Any:
        """Remove the panel and its exposed binding from the page.

        ``close()`` is synchronous for the sync API and returns an awaitable for
        the async API. The init script already registered on this page becomes
        inert once its binding is disposed.
        """
        if self._is_async:
            return self._close_async()
        return self._close_sync()

    def _close_sync(self) -> None:
        self._closed = True
        self._stop_requested = True
        try:
            self._page.evaluate(
                """hostId => {
                    const host = document.getElementById(hostId);
                    if (!host) return;
                    if (typeof host.__pwAutomationStudioDispose === "function") {
                        host.__pwAutomationStudioDispose();
                    }
                    host.remove();
                }""",
                self._host_id,
            )
        except Exception:
            # The page may already have been closed or navigated away.
            pass
        self._dispose_sync_binding()

    async def _close_async(self) -> None:
        self._closed = True
        self._stop_requested = True
        try:
            await self._page.evaluate(
                """hostId => {
                    const host = document.getElementById(hostId);
                    if (!host) return;
                    if (typeof host.__pwAutomationStudioDispose === "function") {
                        host.__pwAutomationStudioDispose();
                    }
                    host.remove();
                }""",
                self._host_id,
            )
        except Exception:
            # The page may already have been closed or navigated away.
            pass
        await self._dispose_async_binding()

    def _dispose_sync_binding(self) -> None:
        if self._binding_handle is None:
            return
        try:
            self._binding_handle.dispose()
        finally:
            self._binding_handle = None

    async def _dispose_async_binding(self) -> None:
        if self._binding_handle is None:
            return
        try:
            await self._binding_handle.dispose()
        finally:
            self._binding_handle = None

    async def _handle_message(
        self, source: Dict[str, Any], payload: Any
    ) -> Dict[str, Any]:
        if self._closed:
            return {"ok": False, "message": "پنل بسته شده است"}
        if not self._is_main_frame(source):
            return {"ok": False, "message": "این فرمان فقط از صفحهٔ اصلی پذیرفته می‌شود"}
        if not isinstance(payload, dict) or payload.get("token") != self._bridge_token:
            return {"ok": False, "message": "فرمان نامعتبر است"}

        command = payload.get("command")
        if command == "load":
            return self._response(ok=True, include_actions=True)
        if command == "status":
            return self._response(ok=True)
        if command == "save":
            try:
                self._saved_actions = self._validate_actions(
                    payload.get("actions"), allow_empty=True
                )
            except ValueError as error:
                return {"ok": False, "message": str(error)}
            return self._response(ok=True, include_actions=True)
        if command == "stop":
            if self._state.get("status") == "running":
                self._stop_requested = True
                self._state["status"] = "stopping"
                self._state["message"] = "پس از پایان مرحلهٔ جاری متوقف می‌شود"
            return self._response(ok=True)
        if command == "run":
            if self._state.get("status") in {"running", "stopping"}:
                return self._response(ok=False, message="یک گردش‌کار در حال اجراست")
            try:
                actions = self._validate_actions(payload.get("actions"))
            except ValueError as error:
                return {"ok": False, "message": str(error)}
            self._saved_actions = actions
            return await self._run_actions(actions)

        return {"ok": False, "message": "فرمان ناشناخته است"}

    def _is_main_frame(self, source: Dict[str, Any]) -> bool:
        frame = source.get("frame")
        frame_impl = getattr(frame, "_impl_obj", frame)
        return frame_impl is getattr(self._page_impl, "main_frame", None)

    def _response(
        self,
        *,
        ok: bool,
        include_actions: bool = False,
        message: Optional[str] = None,
    ) -> Dict[str, Any]:
        response: Dict[str, Any] = {"ok": ok, **self._snapshot_state()}
        if include_actions:
            response["actions"] = self._saved_actions
        if message:
            response["message"] = message
        return response

    def _snapshot_state(self) -> Dict[str, Any]:
        snapshot = dict(self._state)
        try:
            snapshot["url"] = self._page_impl.url
        except Exception:
            snapshot["url"] = ""
        return snapshot

    def _validate_actions(
        self, actions: Any, *, allow_empty: bool = False
    ) -> List[Dict[str, Any]]:
        if not isinstance(actions, list):
            raise ValueError("فهرست مراحل معتبر نیست")
        if len(actions) > self._max_steps:
            raise ValueError(f"حداکثر {self._max_steps} مرحله مجاز است")
        if not actions and not allow_empty:
            raise ValueError("ابتدا دست‌کم یک مرحله اضافه کنید")

        validated: List[Dict[str, Any]] = []
        for index, raw_action in enumerate(actions, start=1):
            if not isinstance(raw_action, dict):
                raise ValueError(f"مرحلهٔ {index} معتبر نیست")
            action_type = raw_action.get("type")
            if not isinstance(action_type, str) or action_type not in _ACTIONS:
                raise ValueError(f"نوع عملیات مرحلهٔ {index} پشتیبانی نمی‌شود")

            action: Dict[str, Any] = {"type": action_type}
            if action_type in _ACTIONS_WITH_TARGET:
                action["target"] = self._validate_target(
                    raw_action.get("target"), index
                )
            if action_type in _ACTIONS_WITH_TEXT:
                action["value"] = self._text(
                    raw_action.get("value"),
                    f"مقدار مرحلهٔ {index}",
                    allow_empty=action_type == "fill",
                )
            if action_type == "wait":
                state = raw_action.get("state", "visible")
                if not isinstance(state, str) or state not in _WAIT_STATES:
                    raise ValueError(f"وضعیت انتظار مرحلهٔ {index} معتبر نیست")
                action["state"] = state
            if action_type == "delay":
                milliseconds = raw_action.get("milliseconds")
                if isinstance(milliseconds, bool) or not isinstance(
                    milliseconds, (int, float)
                ):
                    raise ValueError(f"مدت مکث مرحلهٔ {index} باید عدد باشد")
                milliseconds = int(milliseconds)
                if milliseconds < 0 or milliseconds > 120_000:
                    raise ValueError("مکث باید بین صفر تا ۱۲۰٬۰۰۰ میلی‌ثانیه باشد")
                action["milliseconds"] = milliseconds
            if action_type == "navigate":
                url = self._text(raw_action.get("url"), f"نشانی مرحلهٔ {index}")
                scheme = urlsplit(url).scheme.lower()
                if scheme == "javascript":
                    raise ValueError("نشانی‌های javascript: مجاز نیستند")
                action["url"] = url
            if action_type == "screenshot":
                path = raw_action.get("path", "automation-screenshot.png")
                action["path"] = self._text(path, f"مسیر تصویر مرحلهٔ {index}")
                full_page = raw_action.get("full_page", False)
                if not isinstance(full_page, bool):
                    raise ValueError(f"گزینهٔ full_page مرحلهٔ {index} معتبر نیست")
                action["full_page"] = full_page
            validated.append(action)
        return validated

    def _validate_target(self, raw_target: Any, index: int) -> Dict[str, Any]:
        if not isinstance(raw_target, dict):
            raise ValueError(f"عنصر هدف مرحلهٔ {index} مشخص نشده است")
        kind = raw_target.get("kind")
        if not isinstance(kind, str) or kind not in _TARGET_KINDS:
            raise ValueError(f"نوع انتخابگر مرحلهٔ {index} معتبر نیست")
        value = self._text(
            raw_target.get("value"), f"انتخابگر مرحلهٔ {index}", max_length=_MAX_SELECTOR_LENGTH
        )
        target: Dict[str, Any] = {"kind": kind, "value": value}
        if kind == "role":
            name = raw_target.get("name")
            if name is not None:
                target["name"] = self._text(
                    name,
                    f"نام دسترس‌پذیر مرحلهٔ {index}",
                    allow_empty=True,
                    max_length=_MAX_SELECTOR_LENGTH,
                )
            exact = raw_target.get("exact", True)
            if not isinstance(exact, bool):
                raise ValueError(f"گزینهٔ exact مرحلهٔ {index} معتبر نیست")
            target["exact"] = exact
        elif kind != "css":
            exact = raw_target.get("exact", True)
            if not isinstance(exact, bool):
                raise ValueError(f"گزینهٔ exact مرحلهٔ {index} معتبر نیست")
            target["exact"] = exact
        return target

    @staticmethod
    def _text(
        value: Any,
        label: str,
        *,
        allow_empty: bool = False,
        max_length: int = _MAX_TEXT_LENGTH,
    ) -> str:
        if not isinstance(value, str):
            raise ValueError(f"{label} باید متن باشد")
        if len(value) > max_length:
            raise ValueError(f"{label} بیش از حد طولانی است")
        if not allow_empty and not value.strip():
            raise ValueError(f"{label} نمی‌تواند خالی باشد")
        if "\x00" in value:
            raise ValueError(f"{label} شامل نویسهٔ نامعتبر است")
        return value

    def _build_locator(self, target: Dict[str, Any]) -> Any:
        kind = target["kind"]
        value = target["value"]
        exact = target.get("exact", True)
        if kind == "role":
            options: Dict[str, Any] = {"exact": exact}
            if "name" in target:
                options["name"] = target["name"]
            return self._page_impl.get_by_role(value, **options)
        if kind == "label":
            return self._page_impl.get_by_label(value, exact=exact)
        if kind == "placeholder":
            return self._page_impl.get_by_placeholder(value, exact=exact)
        if kind == "text":
            return self._page_impl.get_by_text(value, exact=exact)
        if kind == "testid":
            return self._page_impl.get_by_test_id(value)
        if kind == "title":
            return self._page_impl.get_by_title(value, exact=exact)
        # Prefix as CSS explicitly so a CSS selector cannot be interpreted as a
        # Playwright text/role selector supplied by a page or workflow.
        return self._page_impl.locator(f"css={value}")

    async def _run_actions(self, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        self._stop_requested = False
        self._state = {
            "status": "running",
            "current": 0,
            "total": len(actions),
            "message": f"اجرای {len(actions)} مرحله آغاز شد",
            "error": "",
        }

        for index, action in enumerate(actions, start=1):
            if self._stop_requested:
                self._state["status"] = "stopped"
                self._state["message"] = "گردش‌کار متوقف شد"
                break
            self._state["current"] = index
            self._state["message"] = f"در حال اجرای مرحلهٔ {index} از {len(actions)}"
            try:
                await self._execute_action(action)
            except Exception as error:
                self._state["status"] = "error"
                self._state["message"] = f"مرحلهٔ {index} ناموفق بود"
                self._state["error"] = str(error)[:600]
                return self._response(ok=False, include_actions=True)

        if self._state.get("status") in {"running", "stopping"}:
            if self._stop_requested:
                self._state["status"] = "stopped"
                self._state["message"] = "گردش‌کار متوقف شد"
            else:
                self._state["status"] = "completed"
                self._state["message"] = "همهٔ مراحل با موفقیت اجرا شدند"
        return self._response(
            ok=self._state["status"] in {"completed", "stopped"},
            include_actions=True,
        )

    async def _execute_action(self, action: Dict[str, Any]) -> None:
        action_type = action["type"]
        if action_type == "delay":
            await self._page_impl.wait_for_timeout(action["milliseconds"])
            return
        if action_type == "navigate":
            await self._page_impl.goto(
                action["url"], timeout=self._timeout, waitUntil="domcontentloaded"
            )
            return
        if action_type == "screenshot":
            await self._page_impl.screenshot(
                path=action["path"],
                fullPage=action["full_page"],
                timeout=self._timeout,
                style=f"#{self._host_id} {{ visibility: hidden !important; }}",
            )
            return

        locator = self._build_locator(action["target"])
        if action_type == "click":
            await locator.click(timeout=self._timeout)
        elif action_type == "double_click":
            await locator.dblclick(timeout=self._timeout)
        elif action_type == "hover":
            await locator.hover(timeout=self._timeout)
        elif action_type == "fill":
            await locator.fill(action["value"], timeout=self._timeout)
        elif action_type == "type":
            await locator.press_sequentially(action["value"], timeout=self._timeout)
        elif action_type == "clear":
            await locator.clear(timeout=self._timeout)
        elif action_type == "press":
            await locator.press(action["value"], timeout=self._timeout)
        elif action_type == "select":
            await locator.select_option(value=action["value"], timeout=self._timeout)
        elif action_type == "check":
            await locator.check(timeout=self._timeout)
        elif action_type == "uncheck":
            await locator.uncheck(timeout=self._timeout)
        elif action_type == "wait":
            await locator.wait_for(state=action["state"], timeout=self._timeout)
        elif action_type == "scroll":
            await locator.scroll_into_view_if_needed(timeout=self._timeout)

