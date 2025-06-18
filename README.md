# DfE Login Public API

[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest) [![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)

API for external consumers to interact with DfE login

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

The token must be signed using the HS256 algorythm with your API_SECRET. At the point of integration with DfE Sign-in you would have been given an API_SECRET (not to mistaken with your CLIENT_SECRET), if you don't have this contact the DfE Sign-in team and we will regenerate one for you (these are seervice/env specific.)

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

## Manage announcements

Announcements can be published and unpublished for an organisation.

Announcements can be published by:

```
POST https://environment-url/organisations/announcements
Authorization: bearer {jwt-token}

{
    "messageId": "your-unique-idenitifer",
	"urn": "12345",
	"type": 1,
	"title": "Title of announcement",
	"summary": "summary of announcement",
	"body": "body of announcement",
	"publishedAt": "2019-01-31T20:30:40Z",
	"expiresAt": "2020-01-31T20:30:40Z"
}
```

The structure of an announcement is as follows:

| Attribute   | Required   | Description                                             | Type         |
| ----------- | ---------- | ------------------------------------------------------- | ------------ |
| messageId   | Y          | Identifier for message in origin system. Must be unique | UUID         |
| urn         | Y (Or uid) | Establishment URN                                       | Numeric      |
| uid         | Y (Or urn) | Group UID                                               | UUID         |
| type        | Y          | The numeric type code of the message (see below)        | Integer      |
| title       | Y          | Title of the announcement. Max characters limit 255     | Text or HTML |
| summary     | Y          | Summary of the announcement. Max characters Limit 340   | Text or HTML |
| body        | Y          | Body of the announcement. Max characters Limit 5000     | Text or HTML |
| publishedAt | Y          | Date/time announcement published at                     | ISO8601      |
| expiresAt   |            | Date/time announcement should expire at                 | ISO8601      |

possible response codes are:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 202              | Your request has been accepted                                                                                                                                                                      |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid.                                                                                                                                                                   |
| 500              | An error occurred on the server. Please ensure that secrets like secrets, API keys, or tokens are correctly configured. If the issue still persists, please contact the support team for assistance |

The valid types of announcement are:

| code | meaning                            |
| ---- | ---------------------------------- |
| 1    | Warning about establishment record |
| 2    | Issue with establishment record    |
| 4    | Warning about governance record    |
| 5    | Issue with governance record       |

Announcements can subsequently be unpublished by:

```
DELETE https://environment-url/organisations/announcements/your-unique-idenitifer
Authorization: bearer {jwt-token}
```

Where `your-unique-idenitifer` is the messageId that was sent when publishing the message.

Possible response codes are:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 204              | Announcement has been unpublished                                                                                                                                                                   |
| 401              | Your JWT is missing or not valid.                                                                                                                                                                   |
| 404              | The message id in the uri does not exist                                                                                                                                                            |
| 500              | An error occurred on the server. Please ensure that secrets like secrets, API keys, or tokens are correctly configured. If the issue still persists, please contact the support team for assistance |

## Regenerate child application secret

If a child application's secret get compromised, you can request that the secret be regenerated by:

```
POST https://environment-url/services/client-id-of-child-application/regenerate-secret
Authorization: bearer {jwt-token}
```

Possible response codes are:

| HTTP Status Code | Reason                                                     |
| ---------------- | ---------------------------------------------------------- |
| 200              | Secret has been regenerated                                |
| 403              | The specified client id is not a child of your application |
| 404              | No application can be found with the specified client id   |

Upon successful regeneration of the secret, you will receive a response like:

```
{
    "clientSecret": "regenerated-client-secret"
}
```

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

```
[
    {
        "id": "org-id",
        "name": "Organisation name",
        "category": {
            "id": "004",
            "name": "Early Year Setting"
        },
        "urn": "org-urn",
        "uid": null,
        "ukprn": null,
        "establishmentNumber": null,
        "status": {
            "id": 1,
            "name": "Open"
        },
        "closedOn": null,
        "address": null,
        "telephone": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "legacyId": "legacy-id",
        "companyRegistrationNumber": null
    },
]
```

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
        "Category": "002",
        "Type": null,
        "URN": null,
        "UID": null,
        "UKPRN": null,
        "EstablishmentNumber": "001",
        "Status": 1,
        "ClosedOn": null,
        "Address": null,
        "phaseOfEducation": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "telephone": null,
        "regionCode": null,
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
        "PIMSProviderTypeCode": "",
        "createdAt": "2019-02-20T14:27:59.020Z",
        "updatedAt": "2019-02-20T14:28:38.223Z"
      },
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

## Service Users with filters

You can get a list of users with filters as defined in the Authorization token (iss attribute).
The request looks like:

```
GET https://environment-url/users?page=1&pageSize=25&status=0&from=2021%2F02%2F11%2002%3A22%3A06&to=2021%2F11%2F03%2002%3A22%3A06
Authorization: bearer {jwt-token}
```

For this endpoint to be used (as opposed to the 'Service Users without filters'), at least one of `status`, `from` or `to` must be provided.

### Query parameters

| Parameter | Description                                              |
| --------- | -------------------------------------------------------- |
| status    | Needs to be 1 or 0                                       |
| from      | Date string in the form of YYYY-MM-DD (e.g., 2025-01-01) |
| to        | Date string in the form of YYYY-MM-DD (e.g., 2025-01-01) |
| page      | A number. Defaults to 1 if not provided                  |
| pageSize  | A number. Defaults to 25 if not provided                 |

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).

### Validation

- The status, from and to are optional
- date range only accepts 7 days
- dates should be in URL encoded form as shown in the example

#### Date range validation

Send error message when the date range is more than 7 days.
Only from date in the filter gets users updated 7 days after the from date.
Only to date in the filter gets users updated 7 days before the to date.
When no date specified, gets users updated from now to 7 days before it.

### Response

The response body contains the following attributes (example response below):

| Name               | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| users              | An array of user details (including a child organisation object)                                         |
| numberOfRecords    | Total number of records reported                                                                         |
| page               | Current page number                                                                                      |
| numberOfPages      | Total number of pages                                                                                    |
| warning (optional) | appears only when fetching only 7 days of users                                                          |
| dateRange          | Human readable description of date range requested. Appears only when `from` and `to` values are present |

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
        "Category": "002",
        "Type": null,
        "URN": null,
        "UID": null,
        "UKPRN": null,
        "EstablishmentNumber": "001",
        "Status": 1,
        "ClosedOn": null,
        "Address": null,
        "phaseOfEducation": null,
        "statutoryLowAge": null,
        "statutoryHighAge": null,
        "telephone": null,
        "regionCode": null,
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
        "PIMSProviderTypeCode": "",
        "createdAt": "2019-02-20T14:27:59.020Z",
        "updatedAt": "2019-02-20T14:28:38.223Z"
      },
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
  "warning": "Only 7 days of data can be fetched",
  "dateRange": "Users between Sun, 01 Jan 2023 00:00:00 GMT and Thu, 05 Jan 2023 00:00:00 GMT"
}
```

To interpret the category id, see [here](#how-do-ids-map-to-categories-and-types).

## Approvers for organisations

You can get a list of approvers for organisations that are within your services scope (based on role policy conditions)
if your service has permission to do so.

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
| 403              | Your application does not have permission to get approvers for organisations                                                                                                                        |
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
| UKPRN     | URL      | Y        | UKPRN for the organisation                                                                            |
| roles     | URL      | N        | User role codes to filter organisation user's list                                                    |
| jwt-token | Header   | Y        | The JWT token for authorization should be signed using your API secret, which will be provided to you |

Possible response codes include:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200              | Roles retrieved successfully for the requested organisation                                                                                                                                         |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid                                                                                                                                                                    |
| 403              | Your application lacks permission to retrieve users for this organisation                                                                                                                           |
| 404              | No users were found with the specified roles for the requested organization, resulting in an empty array                                                                                            |
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
| UKPRN     | URL      | Y        | UKPRN for the organisation                                                                            |
| email     | URL      | N        | The email address of the user for filtering                                                           |
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
| UPIN      | URL      | Y        | UPIN for the organisation                                                                             |
| roles     | URL      | N        | User role codes to filter organisation user's list                                                    |
| jwt-token | Header   | Y        | The JWT token for Authorization should be signed using your API secret, which will be provided to you |

Possible response codes include:

| HTTP Status Code | Reason                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200              | Roles retrieved successfully for the requested organisation                                                                                                                                         |
| 400              | Your request is invalid. Additional details will be provided in the response body                                                                                                                   |
| 401              | Your JWT is missing or not valid                                                                                                                                                                    |
| 403              | Your application lacks permission to retrieve users for this organisation                                                                                                                           |
| 404              | No users were found with the specified roles for the requested organization, resulting in an empty array                                                                                            |
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
| UPIN      | URL      | Y        | UPIN for the organisation                                                                             |
| email     | URL      | N        | The email address of the user for filtering                                                           |
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
| 001 | Community School                                  |
| 002 | Voluntary Aided School                            |
| 003 | Voluntary Controlled School                       |
| 005 | Foundation School                                 |
| 006 | City Technology College                           |
| 007 | Community Special School                          |
| 008 | Non-Maintained Special School                     |
| 010 | Other Independent Special School                  |
| 011 | Other INdependent School                          |
| 012 | Fondation Special School                          |
| 014 | Pupil Referral Unit                               |
| 015 | LA Nursery School                                 |
| 018 | Further Education                                 |
| 024 | Secure Units                                      |
| 025 | Offshore Schools                                  |
| 026 | Service Childrens Education                       |
| 027 | Miscellanenous                                    |
| 028 | Academy Sponsor Led                               |
| 029 | Higher Education Institution                      |
| 030 | Welsh Establishment                               |
| 031 | Sixth Form Centres                                |
| 032 | Special Post 16 Institution                       |
| 033 | Academy Special Sponsor Led                       |
| 034 | Academy Converter                                 |
| 035 | Free Schools                                      |
| 036 | Free Schools Special                              |
| 037 | British Overseas Schools                          |
| 038 | Free Schools - Alternative Provision              |
| 039 | Free Schools - 16-19                              |
| 040 | University Teachnical College                     |
| 041 | Studio Schools                                    |
| 042 | Academy Alternative Provision Converter           |
| 043 | Academy Alternative Provision Sponsor Led         |
| 044 | Academy Special Converter                         |
| 045 | Academy 16-19 Converter                           |
| 046 | Academy 16-19 Sponsor Led                         |
| 047 | Children's Centre                                 |
| 048 | Children's Centre Linked Site                     |
| 056 | Institution funded by other government department |
| 057 | Academy secure 16 to 19                           |

## Postman collection

We do have a Postman workspace with some sample requests, which is available upon request on the Slack channel `dfe-sign-in`.
