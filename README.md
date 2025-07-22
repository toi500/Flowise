## Recent Updates

### 1. Added `/clear` Command

End users can now use the `/clear` command to delete their chat history.

**Technical details:**

-   When `/clear` is sent, all chat history for the current chatflow and session is deleted from the database.
-   Implemented in both `buildAgentflow.ts` and `buildChatflow.ts`.
-   The backend returns an empty message to confirm deletion.

![chrome_P0drDzpy6U](https://github.com/user-attachments/assets/c36bb573-f5bd-4904-b6ae-f6c678db909a)


### 2. Execution Recording Control

You can skip execution recording by setting the `DISABLE_EXECUTION_RECORDING` environment variable.

**Technical details:**

-   If `DISABLE_EXECUTION_RECORDING` is set to `'true'`, execution data is not saved to the database.
-   A mock execution object is returned instead.
-   Useful for privacy or performance reasons.

![chrome_a7U8Ym2eBs](https://github.com/user-attachments/assets/abfaa2e5-808f-4445-9dcf-3a85a0ae8830)


### 3. Logging Configuration

Improved logging configuration to handle the log level `none`.

**Technical details:**

-   If `LOG_LEVEL` is set to `none`, all logging transports are replaced with a `NullTransport`.
-   No logs are recorded, and a warning is printed to the console.
-   The request logger also skips logging if `LOG_LEVEL=none`.
  
<img width="1038" height="532" alt="capture_250721_210706" src="https://github.com/user-attachments/assets/8fe4547a-8fdf-4219-b351-11206affe014" />
