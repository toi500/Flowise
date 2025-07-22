## Recent Updates

### 1. Added `/clear` Command

End users can now use the `/clear` command to delete their chat history.

**Technical details:**

-   When `/clear` is sent, all chat history for the current chatflow and session is deleted from the database.
-   Implemented in both `buildAgentflow.ts` and `buildChatflow.ts`.
-   The backend returns an empty message to confirm deletion.

### 2. Execution Recording Control

You can skip execution recording by setting the `DISABLE_EXECUTION_RECORDING` environment variable.

**Technical details:**

-   If `DISABLE_EXECUTION_RECORDING` is set to `'true'`, execution data is not saved to the database.
-   A mock execution object is returned instead.
-   Useful for privacy or performance reasons.

### 3. Logging Configuration

Improved logging configuration to handle the log level `none`.

**Technical details:**

-   If `LOG_LEVEL` is set to `none`, all logging transports are replaced with a `NullTransport`.
-   No logs are recorded, and a warning is printed to the console.
-   The request logger also skips logging if `LOG_LEVEL=none`.
