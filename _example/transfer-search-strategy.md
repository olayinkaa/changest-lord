# Transfer Recipient Search Strategy

## Search Method: GET vs POST

When implementing a recipient search functionality that utilizes Personally Identifiable Information (PII) such as phone numbers, the choice of HTTP method is critical for security and privacy.

### Recommendation: Use `POST`

While search operations are traditionally `GET` requests, for financial applications, `POST` is strongly recommended.

#### Why `POST`?
1. **Log Privacy**: `GET` request parameters are part of the URL. URLs are frequently logged in plain text by:
   - Web server logs (Nginx, Apache)
   - Load balancers and API Gateways
   - Browser history and proxy logs
   - Application monitoring tools (Sentry, Datadog)
   
   Using `POST` ensures that customer phone numbers are transmitted in the request body, which is encrypted via HTTPS and typically not logged by infrastructure.
2. **Security**: Moving PII from the URL to the body reduces the attack surface for shoulder-surfing and log-leakage.

---

## Frontend-to-Backend Interaction Flow

The application follows a **"Lookup $\rightarrow$ Decision"** pattern to handle both registered and unregistered users.

### 1. The Lookup Phase
- **Frontend Action**: User types a phone number or User ID into the search field.
- **API Call**: `POST /api/v1/transfer/search` with body `{ "query": "08012345678" }`.
- **Backend Responses**:
    - **Success (200 OK)**: Returns a `UserResponseDto` containing the user's real name and internal `userId`.
    - **Not Found (404 Not Found)**: Indicates the recipient is not a registered user of the platform.

### 2. The UI Decision Phase
Based on the API response, the frontend determines the next step:

| API Response | UI State | Next Action |
| :--- | :--- | :--- |
| **Record Found** | Show User Profile | User clicks the profile $\rightarrow$ **Show Keypad** |
| **No Record** | Show "External User" | **Automatically Show Keypad** |

### 3. The Execution Phase
When the user submits the transfer amount via the keypad:

- **If User was Found**: The request to `/execute` includes the `userId`. The system performs a direct internal wallet-to-wallet transfer.
- **If User was NOT Found**: The request to `/execute` includes the `phone number` as the `recipientAccount`. The system then:
    1. Verifies if the transaction type allows unregistered recipients (e.g., `GIVE_CHANGE`).
    2. If allowed, routes the funds to a **Transit Wallet** or initiates an external payout.
    3. If not allowed, returns a `NotFoundException`.
