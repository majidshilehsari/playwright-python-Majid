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

from playwright.async_api import Page
from playwright.automation_studio import AutomationStudio


async def test_automation_studio_runs_workflow(page: Page) -> None:
    await page.set_content(
        """
        <input placeholder="Your name">
        <button type="button" onclick="document.querySelector('output').textContent = document.querySelector('input').value">
          Send
        </button>
        <output></output>
        """
    )
    studio = AutomationStudio(page)
    await studio.start()
    try:
        result = await page.evaluate(
            """async ({ binding, token, actions }) =>
                await window[binding]({ command: "run", token, actions })""",
            {
                "binding": studio._binding_name,
                "token": studio._bridge_token,
                "actions": [
                    {
                        "type": "fill",
                        "target": {
                            "kind": "placeholder",
                            "value": "Your name",
                            "exact": True,
                        },
                        "value": "Majid",
                    },
                    {
                        "type": "click",
                        "target": {
                            "kind": "role",
                            "value": "button",
                            "name": "Send",
                            "exact": True,
                        },
                    },
                ],
            },
        )
        assert result["status"] == "completed"
        assert await page.locator("output").inner_text() == "Majid"
    finally:
        await studio.close()
