# DfE Login Public API

**DfE Login Public API** provides secure, RESTful endpoints for external consumers and relying parties to integrate with the DfE Sign-in platform. It enables access to user, organisation, and service data, supporting operations such as invitations, access management, and announcements. This service is part of the wider **login.dfe** project.

## Getting Started

### Install Dependencies

```
npm install
```

### Run application

Start the application with:

```
npm run dev
```

Once the application has started, you can view it in the browser by going to:

```
https://localhost:43890
```

### Run Tests

Run all tests with:

```
npm run test
```

### Code Quality and Formatting

Run ESLint:

```
npm run lint
```

Automatically fix lint issues:

```
npm run lint:fix
```

### Development Checks

Run linting and tests together:

```
npm run dev:checks
```

### Pre-commit Hooks

Pre-commit hooks are handled automatically via Husky. No additional setup is required.

## You need to authenticate with these APIs

To use any of the APIs below you will need to provide a Bearer token in the header of the request, this bearer token is simply a JWT (see https://jwt.io) with a simple payload which is signed using a secret that only DfE Sign-in and you know.

You should create a JWT at the point of use in your calling application using the standard JWT library that comes with your chosen technology.

The token body will require and issuer (your service client id) and an audience as follows:

```$json
{
  "iss": "REPLACE_WITH_YOUR_CLIENT_ID",
  "aud": "signin.education.gov.uk"
}
```

The token must be signed using the HS256 algorithm with your API_SECRET. At the point of integration with DfE Sign-in you would have been given an API_SECRET (not to mistaken with your CLIENT_SECRET), if you don't have this contact the DfE Sign-in team and we will regenerate one for you (these are service/env specific.)

## Using Postman for evaluating and testing the APIs

### Overview of Postman

Postman is an API platform tool used for building and executing APIs. Postman simplifies each step of the API lifecycle and is used extensively in the development and documentation of the DfE Sign-in Public API.

A suite of Postman collections and their associated execution environments have been provided to help you learn, test and debug your integrations with DfE Sign-in platform via the Public API.

### Getting started with Postman and the DfE Sign-in collection suite

The Postman API platform tools are available as a desktop client, hosted web application and a command line interface (CLI) at https://www.postman.com/api-platform/api-client/.

The DfE Sign-in Public API Postman collection and environments are available at https://github.com/DFE-Digital/login.dfe.public-api/tree/develop/Postman/.

## Invite User

As a service on-boarded to DfE Sign-in, you can use the API to invite users to the service.

The request looks like

```
POST https://environment-url/services/{service-id}/invitations
Authorization: bearer {jwt-token}

{
    "sourceId": "user_id_in_your_service",
	"given_name": "John",
	"family_name": "Smith",
	"email": "john.smith@domain.test",
	"callback": "https://me.service.url/users/signup-complete"
}
```

The variable data items are:

| Name                  | Location | Required | Description                                                                                                                                                |
| --------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| service-id            | URL      | Y        | The DfE Sign-in identifier for the service you are inviting user to                                                                                        |
| jwt-token             | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you                                                      |
| sourceId              | Body     | Y        | The identifier of the user in your system. Will be included in back channel response                                                                       |
| given_name            | Body     | Y        | The users given name                                                                                                                                       |
| family_name           | Body     | Y        | The user family name                                                                                                                                       |
| email                 | Body     | Y        | The email address of the user. This is also a unique identifier of a user in DfE Sign-in                                                                   |
| organisation          | Body     |          | The DfE Sign-in identifier that the user should be associated to                                                                                           |
| callback              | Body     |          | The URL that the back channel response should be sent to. See details of back channel response below                                                       |
| userRedirect          | Body     |          | The URL that a user, if going through the onboarding, should be returned to upon completion. If omitted, the default redirect for your client will be used |
| inviteSubjectOverride | Body     |          | Overrides the subject of the invitation email                                                                                                              |
| inviteBodyOverride    | Body     |          | Overrides the content of the invitation email                                                                                                              |

Possible response codes are:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 202              | Your request has been accepted                                                                                                                                                                      |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid.                                                                                                                                                                   |
| 404              | The service id in the uri does not exist                                                                                                                                                            |
| 500              | An error occurred on the server. Please ensure that secrets like secrets, API keys, or tokens are correctly configured. If the issue still persists, please contact the support team for assistance |

When the request is made, the user may or may not exist in the system;
and may or may not have the desired organisation and service mappings requested.
For this reason, all user details are sent via a back channel response. This can
either happen immediately if the user is found (by email) in DfE Sign-in; or once
the user accepts the invitation email that will be sent to them.

The back channel response looks like:

```
POST https://callback.url/from/request
Authorization: bearer {jwt-token}

{
    "sub": "some-uuid",
    "sourceId: "source-id-from-request"
}
```

The data items in the request are:

| Name      | Location | Description                                                                                              |
| --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| jwt-token | Header   | A jwt token, signed with same secret as request                                                          |
| sub       | Body     | DfE Sign-in identifier for user. This will not change and will be included in OIDC response as sub claim |
| sourceId  | Body     | The sourceId used in original request                                                                    |

## Get user access to service

You can use this API to get a user's access to a service for an organisation.
The request looks like

```
GET https://environment-url/services/{service-id}/organisations/{organisation-id}/users/{user-id}
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name            | Location | Required | Description                                                                                           |
| --------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| service-id      | URL      | Y        | The DfE Sign-in identifier for the service                                                            |
| organisation-id | URL      | Y        | The DfE Sign-in identifier for the organisation                                                       |
| user-id         | URL      | Y        | The DfE Sign-in identifier for the user                                                               |
| jwt-token       | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

This will return a response in the following format

```
{
    "userId": "user-id",
    "serviceId": "service-id",
    "organisationId": "organisation-id",
    "roles": [
        {
            "id": "role-id",
            "name": "The name of the role",
            "code": "The code of the role",
            "numericId": "9999",
            "status": {
                "id": 1
            }
        }
    ],
    "identifiers": [
        {
            "key": "identifier-key",
            "value": "identifier-value"
        }
    ]
}
```

Note: If User does not have the specified Service or is not in the Organisation stated, it will return status code **404 (Not Found)**.

## Get organisations for user

You can use this API to get the organisations associated with a user
The request looks like

```
GET https://environment-url/users/{user-id}/organisations
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| user-id   | URL      | Y        | The DfE Sign-in identifier for the user                                                               |
| jwt-token | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

This will return a response in the following format

```json
[
  {
    "id": "org-id",
    "name": "Organisation name",
    "LegalName": "Organisation legal name",
    "category": {
      "id": "001",
      "name": "Establishment"
    },
    "type": {
      "id": "01",
      "name": "Community school"
    },
    "urn": "100000",
    "uid": null,
    "ukprn": "10000001",
    "upin": "100001",
    "establishmentNumber": "2001",
    "status": {
      "id": 1,
      "name": "Open",
      "tagColor": "green"
    },
    "closedOn": null,
    "OpenedOn": "2000-09-01T00:00:00.0000000Z",
    "address": "1 Example Street, Example Town, EX1 1AA",
    "telephone": "01234567890",
    "phaseOfEducation": {
      "id": 2,
      "name": "Primary"
    },
    "statutoryLowAge": 4,
    "statutoryHighAge": 11,
    "region": {
      "id": "H",
      "name": "London"
    },
    "localAuthority": {
      "id": "la-org-id",
      "name": "Example Local Authority",
      "code": "999"
    },
    "DistrictAdministrativeCode": "E09000001",
    "DistrictAdministrativeName": "Example District",
    "DistrictAdministrative_code": null,
    "legacyId": "legacy-id",
    "companyRegistrationNumber": null,
    "SourceSystem": "GIAS",
    "providerTypeName": "Local authority maintained schools",
    "ProviderTypeCode": 1,
    "GIASProviderType": "Community school",
    "GIASStatus": 1,
    "GIASStatusName": "Open",
    "PIMSProviderType": "Local Authority Maintained School",
    "PIMSProviderTypeCode": 1,
    "pimsStatus": 1,
    "PIMSStatusName": "Open",
    "MasterProviderStatusCode": 1,
    "MasterProviderStatusName": "Active",
    "IsOnAPAR": "No"
  }
]
```

Notes:

- The response is an array of organisations (not wrapped in an object).
- Organisations with a status id of `0` are not returned.
- If the user has no organisations, the response is **404 (Not Found)** with an empty body.
- The example above shows all the attributes currently returned. Values that are not known are `null`.
- Attributes such as `SourceSystem`, `legacyId`, `status.tagColor` and `DistrictAdministrative_code` are for internal
  DfE Sign-in use and should not be relied upon; they may be removed in a future version.

## Get roles for service

You can use this API endpoint to get the roles associated with your service, or one of your child services. The request looks like:

```
GET https://environment-url/services/{client-id}/roles
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| client-id | URL      | Y        | The DfE Sign-in client identifier for the service                                                     |
| jwt-token | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

Possible response codes are:

| HTTP Status Code | Reason                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 200              | A (possibly empty) list of roles has been retrieved successfully for the requested client ID. |
| 403              | The specified client ID is not your service, or a child of your service.                      |
| 404              | No service can be found with the specified client ID.                                         |

This will return a response in the following format:

```
[
    {
        "name": "Role 1 Name",
        "code": "Role1Code",
        "status": "Active"
    },
    {
        "name": "Role 2 Name",
        "code": "Role2Code",
        "status": "Inactive"
    }
]
```

or the following if no roles were found:

```
[]
```

## Get organisations for user including Provider Profile organisation attributes

You can use this API to get the organisations associated with a user
The request looks like

```
GET https://environment-url/users/{user-id}/v2/organisations
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| user-id   | URL      | Y        | The DfE Sign-in identifier for the user                                                               |
| jwt-token | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

This will return a response in the following format

```
[
    {
        "id": "org-id",
        "name": "Organisation name",
        "category": {
            "id": "001",
            "name": "Establishment"
        },
        "urn": null,
        "uid": null,
        "upin": "111111",
        "ukprn": "21133510",
        "establishmentNumber": null,
        "status": {
            "id": 1,
            "name": "Open"
        },
        "closedOn": null,
        "address": "Organisation address",
        "telephone": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "legacyId": "1111",
        "companyRegistrationNumber": null,
        "DistrictAdministrativeCode": null,
        "DistrictAdministrative_code": null,
        "providerTypeName": "Commercial and Charitable Provider",
        "ProviderProfileID": "7777777",
        "OpenedOn": null,
        "SourceSystem": "PIMS",
        "GIASProviderType": null,
        "PIMSProviderType": "Private Limited Company",
        "PIMSProviderTypeCode": 11,
        "PIMSStatus": "1",
        "masteringCode": null,
        "PIMSStatusName": "",
        "GIASStatus": null,
        "GIASStatusName": null,
        "MasterProviderStatusCode": 1,
        "MasterProviderStatusName": "Active",
        "LegalName": "Org Legal Name"
    },
]
```

## Get organisations and services for user

You can use this API to get the organisations associated with a user
The request looks like

```
GET https://environment-url/users/{user-id}/organisationservices
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| user-id   | URL      | Y        | The DfE Sign-in identifier for the user                                                               |
| jwt-token | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

This will return a response in the following format

```
{
    "userId": "user-1",
    "userStatus": 1,
    "email": "test-user@education.gov.uk",
    "familyName": "User",
    "givenName": "Test",
    "organisations": [
        {
            "id": "org-1",
            "name": "Test org name",
            "category": {
                "id": "002",
                "name": "Local Authority"
            },
            "urn": null,
            "uid": "123",
            "ukprn": null,
            "establishmentNumber": "001",
            "status": {
                "id": 1,
                "name": "Open"
            },
            "closedOn": null,
            "address": null,
            "telephone": null,
            "statutoryLowAge": null,
            "statutoryHighAge": null,
            "legacyId": "1234567",
            "companyRegistrationNumber": null,
            "ProviderProfileID": null,
            "UPIN": null,
            "PIMSProviderType": null,
            "PIMSStatus": null,
            "DistrictAdministrativeName": null,
            "OpenedOn": null,
            "SourceSystem": null,
            "ProviderTypeName": null,
            "GIASProviderType": null,
            "PIMSProviderTypeCode": null,
            "services": [
                {
                    "name": "DfE Sign-in test service",
                    "description": "DfE Sign-in test service",
                    "roles": [
                        {
                            "name": "Role 1 name",
                            "code": "role-1-code"
                        },
                        {
                            "name": "Role 2 name",
                            "code": "role-2-code"
                        },
                    ]
                },
                {
                    "name": "Another service",
                    "description": "Another service description",
                    "roles": [
                        {
                            "name": "Service role 1",
                            "code": "service_role_2"
                        }
                    ]
                },
                {
                    "name": "DfE Sign-in",
                    "description": "DfE Sign-in Services",
                    "roles": []
                }
            ],
            "orgRoleId": 10000,
            "orgRoleName": "Approver"
        }
    ]
}
```

## Service Users without filters

You can get a list of users without filters as defined in the Authorization token (iss attribute)  
The request looks like:

```
GET https://environment-url/users?page=1&pageSize=25
Authorization: bearer {jwt-token}
```

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).

The response body contains the following attributes (example response below):

| Name            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| users           | An array of user details (including a child organisation object) |
| numberOfRecords | Total number of records reported                                 |
| page            | Current page number                                              |
| numberOfPages   | Total number of pages                                            |

_Response Example_

```json
{
  "users": [
    {
      "approvedAt": "2019-06-19T15:09:58.683Z",
      "updatedAt": "2019-06-19T15:09:58.683Z",
      "organisation": {
        "id": "13F20E54-79EA-4146-8E39-18197576F023",
        "name": "Department for Education",
        "LegalName": "Department for Education",
        "Category": "002",
        "Type": null,
        "URN": null,
        "UID": null,
        "UKPRN": "10000001",
        "UPIN": "100001",
        "EstablishmentNumber": "001",
        "Status": 1,
        "ClosedOn": null,
        "OpenedOn": "2007-09-01T00:00:00.0000000Z",
        "Address": "Sanctuary Buildings, Great Smith Street, London",
        "telephone": null,
        "phaseOfEducation": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "regionCode": null,
        "localAuthorityId": null,
        "localAuthorityCode": null,
        "localAuthorityName": null,
        "DistrictAdministrativeCode": null,
        "DistrictAdministrativeName": null,
        "DistrictAdministrative_code": null,
        "legacyId": "1031237",
        "companyRegistrationNumber": null,
        "ProviderProfileID": "1234",
        "SourceSystem": "PIMS",
        "ProviderTypeName": "Government Body",
        "ProviderTypeCode": 1,
        "GIASProviderType": null,
        "GIASStatus": null,
        "GIASStatusName": null,
        "PIMSProviderType": "Central Government Department",
        "PIMSProviderTypeCode": 1,
        "PIMSStatus": 1,
        "PIMSStatusName": "Open",
        "MasterProviderStatusCode": 1,
        "MasterProviderStatusName": "Active",
        "IsOnAPAR": null,
        "masteringCode": null,
        "createdAt": "2019-02-20T14:27:59.020Z",
        "updatedAt": "2019-02-20T14:28:38.223Z",
        "organisation_id": "13F20E54-79EA-4146-8E39-18197576F023",
        "user_id": "21D62132-6570-4E63-9DCB-137CC35E7543",
        "user_status": 1,
        "user_createdAt": "2019-06-19T15:09:58.683Z",
        "user_updatedAt": "2019-06-19T15:09:58.683Z"
      },
      "roles": [
        {
          "id": "FA3DDF63-6D48-41BB-8706-1048B24D4744",
          "name": "Test Service - Example role",
          "code": "TEST",
          "numericId": "12345",
          "status": 1
        }
      ],
      "roleName": "Approver",
      "roleId": 10000,
      "userId": "21D62132-6570-4E63-9DCB-137CC35E7543",
      "userStatus": 1,
      "email": "foo@example.com",
      "familyName": "Johnson",
      "givenName": "Roger"
    }
  ],
  "numberOfRecords": 1,
  "page": 1,
  "numberOfPages": 1
}
```

Notes on the response:

- `roleId` and `roleName` are omitted when the user has no organisation role.
- The `organisation` object is returned as held by DfE Sign-in and may contain additional attributes.
- The `organisation` object currently also includes attributes describing the user's link to the organisation:
  `user_id`, `organisation_id`, `user_status`, `user_createdAt` and `user_updatedAt`. These duplicate `userId` and
  `organisation.id` or are for internal DfE Sign-in use. Do not rely on them, or on internal attributes such as
  `legacyId`, `SourceSystem`, `masteringCode` and `DistrictAdministrative_code`; they may be removed in a future version.

## Service Users with filters

You can get a list of users with filters as defined in the Authorization token (iss attribute).
The request looks like:

```
GET https://environment-url/users?page=1&pageSize=25&status=1&from=2023-01-01&to=2023-03-31
Authorization: bearer {jwt-token}
```

For this endpoint to be used (as opposed to the 'Service Users without filters'), at least one of `status`, `from` or `to` must be provided.

**Important:** providing any of `status`, `from` or `to` limits the results to a maximum of **90 days** of data.
This includes requests that only provide `status` - see [Date range rules](#date-range-rules) below.
To retrieve all users regardless of date, use [Service Users without filters](#service-users-without-filters).

### Query parameters

| Parameter | Description                                                                          |
| --------- | ------------------------------------------------------------------------------------ |
| status    | User account status. Needs to be `1` (active) or `0` (deactivated)                   |
| from      | Start date, as a date string in the form of YYYY-MM-DD (e.g., 2025-01-01)            |
| to        | End date, as a date string in the form of YYYY-MM-DD (e.g., 2025-01-01). See below   |
| page      | A number. Defaults to 1 if not provided                                              |
| pageSize  | A number. Defaults to 25 if not provided                                             |

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).

### Validation

- The status, from and to are optional
- `from` and `to` can be at most **90 days** apart
- dates in the form YYYY-MM-DD can be sent as they are. If you include a time, URL encode it
  (for example `from=2023-01-01%2009%3A30%3A00`)
- dates are interpreted as UTC. A date without a time is treated as midnight (00:00:00) at the **start** of that day,
  so `to=2025-01-31` does not include changes made during 31 January. Use the following day, or include a time, if you
  need the whole day

#### Date range rules

| Dates provided          | Behaviour                                                                                         | `warning` returned |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------ |
| `from` and `to`         | Users updated between the two dates. Rejected with 400 if more than 90 days apart                 | No                 |
| `from` only             | `to` is set to 90 days after `from` - later changes are **not** returned                          | Yes                |
| `to` only               | `from` is set to 90 days before `to` - earlier changes are **not** returned                       | Yes                |
| neither (`status` only) | Users updated in the **last 90 days** only                                                        | Yes                |

Always check the `dateRange` attribute in the response to see the range that was actually applied, and the `warning`
attribute to see if it was set for you.

#### Error responses

Validation errors return **400 (Bad Request)** with a plain text (not JSON) body:

| Body                                          | Reason                                                  |
| --------------------------------------------- | ------------------------------------------------------- |
| `Status is not valid. Should be either 0 or 1.` | `status` is not `0` or `1`                            |
| `From date is not a valid date.`              | `from` could not be parsed as a date                    |
| `To date is not a valid date.`                | `to` could not be parsed as a date                      |
| `From date greater than to date`              | `from` is after `to`                                    |
| `Only 90 days are allowed between dates`      | `from` and `to` are more than 90 days apart             |
| `Date range should not be in the future`      | both dates are in the future, or the only date provided is in the future |
| `<value> is not a valid value for <name>. Expected a number` | `page` or `pageSize` is not a number     |

### Response

The response body contains the following attributes (example response below):

| Name               | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| users              | An array of user details (including a child organisation object)                                         |
| numberOfRecords    | Total number of records reported                                                                         |
| page               | Current page number                                                                                      |
| numberOfPages      | Total number of pages                                                                                    |
| warning (optional) | `Only 90 days of data can be fetched`. Appears when the API has set `from` and/or `to` for you (see [Date range rules](#date-range-rules)) |
| dateRange          | Human readable description of the date range actually applied, e.g. `Users between Mon, 01 Jun 2026 00:00:00 GMT and Sun, 30 Aug 2026 00:00:00 GMT` |

_Response Example_

```json
{
  "users": [
    {
      "approvedAt": "2019-06-19T15:09:58.683Z",
      "updatedAt": "2019-06-19T15:09:58.683Z",
      "organisation": {
        "id": "13F20E54-79EA-4146-8E39-18197576F023",
        "name": "Department for Education",
        "LegalName": "Department for Education",
        "Category": "002",
        "Type": null,
        "URN": null,
        "UID": null,
        "UKPRN": "10000001",
        "UPIN": "100001",
        "EstablishmentNumber": "001",
        "Status": 1,
        "ClosedOn": null,
        "OpenedOn": "2007-09-01T00:00:00.0000000Z",
        "Address": "Sanctuary Buildings, Great Smith Street, London",
        "telephone": null,
        "phaseOfEducation": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "regionCode": null,
        "localAuthorityId": null,
        "localAuthorityCode": null,
        "localAuthorityName": null,
        "DistrictAdministrativeCode": null,
        "DistrictAdministrativeName": null,
        "DistrictAdministrative_code": null,
        "legacyId": "1031237",
        "companyRegistrationNumber": null,
        "ProviderProfileID": "1234",
        "SourceSystem": "PIMS",
        "ProviderTypeName": "Government Body",
        "ProviderTypeCode": 1,
        "GIASProviderType": null,
        "GIASStatus": null,
        "GIASStatusName": null,
        "PIMSProviderType": "Central Government Department",
        "PIMSProviderTypeCode": 1,
        "PIMSStatus": 1,
        "PIMSStatusName": "Open",
        "MasterProviderStatusCode": 1,
        "MasterProviderStatusName": "Active",
        "IsOnAPAR": null,
        "masteringCode": null,
        "createdAt": "2019-02-20T14:27:59.020Z",
        "updatedAt": "2019-02-20T14:28:38.223Z",
        "organisation_id": "13F20E54-79EA-4146-8E39-18197576F023",
        "user_id": "21D62132-6570-4E63-9DCB-137CC35E7543",
        "user_status": 1,
        "user_createdAt": "2019-06-19T15:09:58.683Z",
        "user_updatedAt": "2019-06-19T15:09:58.683Z"
      },
      "roles": [
        {
          "id": "FA3DDF63-6D48-41BB-8706-1048B24D4744",
          "name": "Test Service - Example role",
          "code": "TEST",
          "numericId": "12345",
          "status": 1
        }
      ],
      "roleName": "Approver",
      "roleId": 10000,
      "userId": "21D62132-6570-4E63-9DCB-137CC35E7543",
      "userStatus": 1,
      "email": "foo@example.com",
      "familyName": "Johnson",
      "givenName": "Roger"
    }
  ],
  "numberOfRecords": 1,
  "page": 1,
  "numberOfPages": 1,
  "warning": "Only 90 days of data can be fetched",
  "dateRange": "Users between Sun, 01 Jan 2023 00:00:00 GMT and Sat, 01 Apr 2023 00:00:00 GMT"
}
```

The example above is the response to a request with `from=2023-01-01` only, so `to` was set to 90 days later and a
`warning` was returned. The notes on the response in [Service Users without filters](#service-users-without-filters)
also apply here.

To interpret the category id, see [here](#how-do-ids-map-to-categories-and-types).

## Approvers for organisations

You can get a list of approvers for organisations that are within your services scope (based on role policy conditions)
if your service has permission to do so.

### Access requirement

This endpoint is only available to services that have the service setting `canViewApproverReport` set to `true`.
The setting is managed by the DfE Sign-in team - contact the DfE Sign-in team to request it for your service.
If your service does not have this setting, every request returns **403 (Forbidden)** with an **empty body**.

A 403 can also be returned (with a JSON body containing a `message`) if your token is not accepted, for example
`Unknown issuer` or `invalid signature`. A 403 with an empty body from this endpoint means your service does not have
the `canViewApproverReport` setting.

The request looks like:

```
GET https://environment-url/users/approvers?page=1&pageSize=25
Authorization: bearer {jwt-token}
```

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).

The response body contains the following attributes (example response below):

| Name            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| users           | An array of user details (including a child organisation object) |
| numberOfRecords | Total number of records reported                                 |
| page            | Current page number                                              |
| numberOfPages   | Total number of pages                                            |

_Response Example_

possible response codes are:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200              | Your request has been accepted                                                                                                                                                                      |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid.                                                                                                                                                                   |
| 403              | Empty body: your service does not have the `canViewApproverReport` setting (see [Access requirement](#access-requirement)). JSON body: your token was not accepted                                 |
| 500              | An error occurred on the server. Please ensure that secrets like secrets, API keys, or tokens are correctly configured. If the issue still persists, please contact the support team for assistance |

```json
{
  "users": [
    {
      "organisation": {
        "id": "13F20E54-79EA-4146-8E39-18197576F023",
        "name": "Department for Education",
        "category": {
          "id": "002",
          "name": "Local Authority"
        },
        "urn": null,
        "uid": null,
        "ukprn": null,
        "establishmentNumber": "001",
        "status": {
          "id": 1,
          "name": "Open"
        },
        "closedOn": null,
        "address": null,
        "telephone": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "legacyId": "1031237",
        "companyRegistrationNumber": "1234567",
        "ProviderProfileID": "",
        "UPIN": "",
        "PIMSProviderType": "Central Government Department",
        "PIMSStatus": "",
        "DistrictAdministrativeName": "",
        "OpenedOn": "2007-09-01T00:00:00.0000000Z",
        "SourceSystem": "",
        "ProviderTypeName": "Government Body",
        "GIASProviderType": "",
        "PIMSProviderTypeCode": ""
      },
      "roleId": 10000,
      "roleName": "Approver",
      "userId": "21D62132-6570-4E63-9DCB-137CC35E7543",
      "userStatus": 1,
      "email": "foo@example.com",
      "familyName": "Johnson",
      "givenName": "Roger"
    }
  ],
  "numberOfRecords": 1,
  "page": 1,
  "numberOfPages": 1
}
```

## How the organisation users endpoint works

The four sections below ([using UKPRN](#get-organisation-users-by-roles-using-ukprn), [using UPIN](#get-organisation-users-by-roles-using-upin)
and the two filtered variants) all describe **one endpoint**:

```
GET https://environment-url/organisations/{UKPRN or UPIN}/users
```

It behaves as follows:

1. **UKPRN is checked first.** The value in the URL is looked up as a UKPRN. It is only looked up as a UPIN if **no**
   organisation has that UKPRN. The response contains a `ukprn` key if the UKPRN lookup was used, or a `upin` key if
   the UPIN lookup was used.
   - If a value is the UKPRN of one organisation and the UPIN of another, the organisation with the UKPRN is always
     used. The organisation with the matching UPIN cannot be retrieved through this endpoint.
   - If organisations are found by UKPRN but none of their users have your service, the response is 404. The UPIN
     lookup is **not** tried in this case.
2. **All matching organisations are included.** More than one organisation can share a UKPRN (or UPIN). Users are
   collected from every matching organisation. The response does not say which organisation each user belongs to.
3. **Only users of your service are returned.** Users are returned only if they have access to the service identified
   by the `iss` of your token, at one of the matching organisations.
4. **Duplicate users are merged.** If the same user (matched by `email`) has access at more than one of the matching
   organisations, they appear **once**. Their `roles` are combined from all those organisations (without duplicates),
   so you cannot tell which organisation each role applies to.
5. **Filters.** `roles` returns users who have **at least one** of the given role codes at an organisation; the user's
   other roles at that organisation are still returned. The filter is applied per organisation, before duplicates are
   merged. `email` and `userId` return only the matching user.
6. **User details.** `firstName`, `lastName` and `userStatus` describe the user's DfE Sign-in account. `userStatus` is
   the account status (`1` active, `0` deactivated) - deactivated accounts are included. The user's status at a
   particular organisation or for your service is not returned.
7. **404 (Not Found)** is returned with an **empty body** if no organisation matches the value, or if no users match
   (including after filters are applied).

## Get organisation users by roles using UKPRN

You can use this API to get the organisations users filtering by roles
The request looks like

```
GET https://environment-url/organisations/{UKPRN}/users?roles=role1,role2
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| UKPRN     | URL      | Y        | UKPRN for the organisation. Checked before UPIN - see [How the organisation users endpoint works](#how-the-organisation-users-endpoint-works) |
| roles     | URL      | N        | User role codes to filter organisation user's list                                                    |
| jwt-token | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

Possible response codes include:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200              | Roles retrieved successfully for the requested organisation                                                                                                                                         |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid                                                                                                                                                                    |
| 403              | Your token was not accepted (for example unknown issuer, invalid signature or invalid audience). The body contains a `message`                                                                      |
| 404              | No organisation matches the value, or no users with your service match (including after filters). The body is empty. See [How the organisation users endpoint works](#how-the-organisation-users-endpoint-works) |
| 500              | An error occurred on the server. Please ensure that secrets like secrets, API keys, or tokens are correctly configured. If the issue still persists, please contact the support team for assistance |

This will return a response in the following format

```
{
    "ukprn": "organisation-ukprn-id",
    "users": [
        {
            "email": "user1@test.com",
            "firstName": "user1",
            "lastName": "test",
            "userStatus": 1,
            "roles": [
                "role1"
            ]
        },
        {
            "email": "user21@test.com",
            "firstName": "user2",
            "lastName": "test",
            "userStatus": 1,
            "roles": [
                "role1",
                "role2"
            ]
        }
    ]
}
```

## Retrieve Organisation Users by Filtered Criteria

You can also use the above API to retrieve organisation users based on filtered criteria such as email address or userId.
The request looks like

```
GET https://environment-url/organisations/{UKPRN}/users?email=example@example.com
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| UKPRN     | URL      | Y        | UKPRN for the organisation. Checked before UPIN - see [How the organisation users endpoint works](#how-the-organisation-users-endpoint-works) |
| email     | URL      | N        | The email address of the user for filtering                                                           |
| userId    | URL      | N        | The DfE Sign-in identifier of the user for filtering                                                  |
| jwt-token | Header   | Y        | The JWT token for Authorization should be signed using your API secret, which will be provided to you |

The response format remains the same as the previous API call, allowing for filtering by specific criteria.

## Get organisation users by roles using UPIN

You can use this API to get the organisations users filtering by roles
The request looks like

```
GET https://environment-url/organisations/{UPIN}/users?roles=role1,role2
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| UPIN      | URL      | Y        | UPIN for the organisation. Only used if no organisation has this value as its UKPRN - see [How the organisation users endpoint works](#how-the-organisation-users-endpoint-works) |
| roles     | URL      | N        | User role codes to filter organisation user's list                                                    |
| jwt-token | Header   | Y        | The JWT token for Authorization should be signed using your API secret, which will be provided to you |

Possible response codes include:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200              | Roles retrieved successfully for the requested organisation                                                                                                                                         |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid                                                                                                                                                                    |
| 403              | Your token was not accepted (for example unknown issuer, invalid signature or invalid audience). The body contains a `message`                                                                      |
| 404              | No organisation matches the value, or no users with your service match (including after filters). The body is empty. See [How the organisation users endpoint works](#how-the-organisation-users-endpoint-works) |
| 500              | An error occurred on the server. Please ensure that secrets like secrets, API keys, or tokens are correctly configured. If the issue still persists, please contact the support team for assistance |

This will return a response in the following format

```
{
    "upin": "organisation-upin-id",
    "users": [
        {
            "email": "user1@test.com",
            "firstName": "user1",
            "lastName": "test",
            "userStatus": 1,
            "roles": [
                "role1"
            ]
        },
        {
            "email": "user21@test.com",
            "firstName": "user2",
            "lastName": "test",
            "userStatus": 1,
            "roles": [
                "role1",
                "role2"
            ]
        }
    ]
}
```

## Retrieve Organisation Users by Filtered Criteria

You can also use the above API to retrieve organisation users based on filtered criteria such as email address or userId.
The request looks like

```
GET https://environment-url/organisations/{UPIN}/users?email=example@example.com
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name      | Location | Required | Description                                                                                           |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| UPIN      | URL      | Y        | UPIN for the organisation. Only used if no organisation has this value as its UKPRN - see [How the organisation users endpoint works](#how-the-organisation-users-endpoint-works) |
| email     | URL      | N        | The email address of the user for filtering                                                           |
| userId    | URL      | N        | The DfE Sign-in identifier of the user for filtering                                                  |
| jwt-token | Header   | Y        | The JWT token for Authorization should be signed using your API secret, which will be provided to you |

The response format remains the same as the previous API call, allowing for filtering by specific criteria.

## How do ids map to categories and types?

#### Organisation Categories

| id  | Description                                                           |
| --- | --------------------------------------------------------------------- |
| 001 | Establishment (see [Establishment Types](#establishment-types) below) |
| 002 | Local Authority                                                       |
| 003 | Other Legacy Organisations                                            |
| 004 | Early Year Setting                                                    |
| 008 | Other Stakeholders                                                    |
| 009 | Training Providers                                                    |
| 010 | Multi-Academy Trust                                                   |
| 011 | Government                                                            |
| 012 | Other GIAS Stakeholder                                                |
| 013 | Single-Academy Trust                                                  |
| 050 | Software Suppliers                                                    |
| 051 | Further Education                                                     |

#### Establishment Types

| id  | Description                                       |
| --- | ------------------------------------------------- |
| 01  | Community School                                  |
| 02  | Voluntary Aided School                            |
| 03  | Voluntary Controlled School                       |
| 05  | Foundation School                                 |
| 06  | City Technology College                           |
| 07  | Community Special School                          |
| 08  | Non-Maintained Special School                     |
| 10  | Other Independent Special School                  |
| 11  | Other INdependent School                          |
| 12  | Foundation Special School                         |
| 14  | Pupil Referral Unit                               |
| 15  | LA Nursery School                                 |
| 18  | Further Education                                 |
| 24  | Secure Units                                      |
| 25  | Offshore Schools                                  |
| 26  | Service children's Education                      |
| 27  | Miscellaneous                                     |
| 28  | Academy Sponsor Led                               |
| 29  | Higher Education Institution                      |
| 30  | Welsh Establishment                               |
| 31  | Sixth Form Centres                                |
| 32  | Special Post 16 Institution                       |
| 33  | Academy Special Sponsor Led                       |
| 34  | Academy Converter                                 |
| 35  | Free Schools                                      |
| 36  | Free Schools Special                              |
| 37  | British Overseas Schools                          |
| 38  | Free Schools - Alternative Provision              |
| 39  | Free Schools - 16-19                              |
| 40  | University Technical College                      |
| 41  | Studio Schools                                    |
| 42  | Academy Alternative Provision Converter           |
| 43  | Academy Alternative Provision Sponsor Led         |
| 44  | Academy Special Converter                         |
| 45  | Academy 16-19 Converter                           |
| 46  | Academy 16-19 Sponsor Led                         |
| 47  | Children's Centre                                 |
| 48  | Children's Centre Linked Site                     |
| 49  | Online Provider                                   |
| 56  | Institution funded by other government department |
| 57  | Academy secure 16 to 19                           |
