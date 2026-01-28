import os
import time
import logging
import re
from typing import Optional, Dict, Any, List
from openai import AzureOpenAI
from azure.identity import InteractiveBrowserCredential

logger = logging.getLogger(__name__)


class FabricDataAgentClient:
    """Client for interacting with Microsoft Fabric Data Agents."""

    def __init__(self, tenant_id: str, data_agent_url: str):
        self.tenant_id = tenant_id
        self.data_agent_url = data_agent_url
        self.credential = None
        self.client = None
        self.assistant_id = None
        self._thread_cache = {}
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Azure OpenAI client with authentication."""
        try:
            self.credential = InteractiveBrowserCredential(
                tenant_id=self.tenant_id,
                client_id="04b07795-8ddb-461a-bbee-02f9e1bf7b46"  # Azure CLI client ID
            )

            token = self.credential.get_token("https://api.fabric.microsoft.com/.default")
            logger.info("Authentication successful")

            self.client = AzureOpenAI(
                azure_endpoint=self.data_agent_url,
                api_version="2024-05-01-preview",
                api_key=token.token
            )

            response = self.client.beta.assistants.list()
            if response.data:
                self.assistant_id = response.data[0].id
                logger.info(f"Assistant ID: {self.assistant_id}")
            else:
                raise ValueError("No assistants found")

        except Exception as e:
            logger.error(f"Failed to initialize client: {str(e)}")
            raise

    def _refresh_token_if_needed(self):
        """Refresh the authentication token if needed."""
        try:
            token = self.credential.get_token("https://api.fabric.microsoft.com/.default")
            self.client.api_key = token.token
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise

    def _get_or_create_new_thread(self, data_agent_url: str, thread_name: Optional[str] = None) -> Dict[str, str]:
        """Get an existing thread or create a new one."""
        if thread_name and thread_name in self._thread_cache:
            return self._thread_cache[thread_name]

        try:
            if not thread_name:
                thread_name = f"thread_{int(time.time())}_{os.urandom(4).hex()}"

            thread = self.client.beta.threads.create(
                metadata={"user_defined_name": thread_name}
            )

            thread_info = {
                "id": thread.id,
                "name": thread_name
            }

            self._thread_cache[thread_name] = thread_info
            logger.info(f"Created thread: {thread_name} (ID: {thread.id})")

            return thread_info

        except Exception as e:
            logger.error(f"Failed to create thread: {str(e)}")
            raise

    def get_raw_run_response(self, question: str, timeout: int = 120, thread_name: Optional[str] = None) -> Dict[str, Any]:
        """Ask a question and return the complete raw response."""
        try:
            self._refresh_token_if_needed()

            thread_info = self._get_or_create_new_thread(self.data_agent_url, thread_name)
            thread_id = thread_info["id"]

            self.client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=question
            )

            run = self.client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=self.assistant_id
            )

            start_time = time.time()
            while True:
                if time.time() - start_time > timeout:
                    logger.error(f"Timeout after {timeout} seconds")
                    return {
                        "question": question,
                        "error": "Timeout",
                        "timeout": timeout,
                        "success": False
                    }

                run_status = self.client.beta.threads.runs.retrieve(
                    thread_id=thread_id,
                    run_id=run.id
                )

                if run_status.status == "completed":
                    break
                elif run_status.status in ["failed", "cancelled", "expired"]:
                    logger.error(f"Run failed with status: {run_status.status}")
                    return {
                        "question": question,
                        "error": f"Run {run_status.status}",
                        "run_status": run_status.status,
                        "success": False
                    }

                time.sleep(2)

            steps = self.client.beta.threads.runs.steps.list(
                thread_id=thread_id,
                run_id=run.id
            )

            messages = self.client.beta.threads.messages.list(thread_id=thread_id)

            # Extract final message
            final_message = ""
            if messages.data:
                for message in messages.data:
                    if message.role == "assistant":
                        if hasattr(message.content[0], 'text'):
                            final_message = message.content[0].text.value
                            break

            return {
                "question": question,
                "run_status": run_status.status,
                "run": run_status.model_dump(),
                "steps": {"data": [step.model_dump() for step in steps.data]},
                "messages": {"data": [msg.model_dump() for msg in messages.data]},
                "final_message": final_message,
                "timestamp": time.time(),
                "success": True
            }

        except Exception as e:
            logger.error(f"Error in get_raw_run_response: {str(e)}")
            return {
                "question": question,
                "error": str(e),
                "success": False
            }
