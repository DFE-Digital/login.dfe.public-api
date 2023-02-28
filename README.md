# DfE Login Public Api
[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.public-api.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.public-api)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest) [![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)

API for external consumers to interact with DfE login

## You need to authenticate with these APIs!

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

| Name                  | Location | Required | Description |
| --------------------- | -------- | -------- | ----------- |
| service-id            | URL      | Y        | The DfE Sign-in identifier for the service you are inviting user to |
| jwt-token             | Header   | Y        | The JWT token for authorization. You will be given a secret to use to sign the token |
| sourceId              | Body     | Y        | The identifier of the user in your system. Will be included in back channel response |
| given_name            | Body     | Y        | The users given name |
| family_name           | Body     | Y        | The user family name |
| email                 | Body     | Y        | The email address of the user. This is also a unique identifier of a user in DfE Sign-in |
| organisation          | Body     |          | The DfE Sign-in identifier that the user should be associated to |
| callback              | Body     |          | The URL that the back channel response should be sent to. See details of back channel response below |
| userRedirect          | Body     |          | The URL that a user, if going through the onboarding, should be returned to upon completion. If omitted, the default redirect for your client will be used |
| inviteSubjectOverride | Body     |          | Overrides the subject of the invitation email |
| inviteBodyOverride    | Body     |          | Overrides the content of the invitation email |

Possible response codes are:

| HTTP Status Code | Reason |
| ---------------- | ------ |
| 202              | Your request has been accepted |
| 400              | Your request is not valid. Details will be included in the body |
| 401              | Your JWT is missing or not valid. |
| 404              | The service id in the uri does not exist |
| 500              | Something has gone wrong on server. If the problem continues contact the team |

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

| Name      | Location | Description |
| --------- | -------- | ----------- |
| jwt-token | Header   | A jwt token, signed with same secret as request |
| sub       | Body     | DfE Sign-in identifier for user. This will not change and will be included in OIDC response as sub claim |
| sourceId  | Body     | The sourceId used in original request |


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

| Attribute   | Required   | Description                                             | Type
| ----------- | ---------- | ------------------------------------------------------- | ---------
| messageId   | Y          | Identifier for message in origin system. Must be unique | UUID
| urn         | Y (Or uid) | Establishment URN                                       | Numeric
| uid         | Y (Or urn) | Group UID                                               | UUID
| type        | Y          | The numeric type code of the message (see below)        | Integer
| title       | Y          | Title of the announcement. Max characters limit 255     | Text or HTML
| summary     | Y          | Summary of the announcement. Max characters Limit 340   | Text or HTML
| body        | Y          | Body of the announcement. Max characters Limit 5000     | Text or HTML
| publishedAt | Y          | Date/time announcement published at                     | ISO8601 
| expiresAt   |            | Date/time announcement should expire at                 | ISO8601

possible response codes are:

| HTTP Status Code | Reason |
| ---------------- | ------ |
| 202              | Your request has been accepted |
| 400              | Your request is not valid. Details will be included in the body |
| 401              | Your JWT is missing or not valid. |
| 500              | Something has gone wrong on server. If the problem continues contact the team |

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

| HTTP Status Code | Reason |
| ---------------- | ------ |
| 204              | Announcement has been unpublished |
| 401              | Your JWT is missing or not valid. |
| 404              | The message id in the uri does not exist |
| 500              | Something has gone wrong on server. If the problem continues contact the team |

## Create child applications
If your application has been enabled, you are able to create child applications through the API. These child applications are intended for use when
you have third party applications that will use the OIDC consent flow to enable them to call an API within your application in the context of a user.

Child applications can be created by:
```
POST https://environment-url/services
Authorization: bearer {jwt-token}

{
	"name": "The display name of the application",
	"description": "A description of what the application does",
	"consentTitle": "Override for the content at the top of the Consent Screen",
	"consentBody": "Override for the content of the Consent Screen",
	"redirectUris": [
	    "https://endpoint.one/auth/cb",
	    "https://endpoint.two/login/callback"
	]
}
```
*Note on Consent Template Overrides*  
Two params allow for overriding of the content displayed to users in the Consent Screen, the title and the body (everything else is static as per the current form design).  The override value is a string that has two (optional) dynamic values.
e.g. `consentTitle="Do you want to allow {{applicationName}} to send data to us for {{roleScope}}"`

The structure of an application is as follows:

| Attribute    | Required   | Description                                                                                 |
| ------------ | ---------- | ------------------------------------------------------------------------------------------- |
| name         | Y          | A user friendly name for the application. This will be used when prompting user for consent |
| description  | N          | A description of the application                                                            |
| redirectUris | Y          | An array of redirect uris that can be used during the OIDC login/consent flow               |

Possible response codes are:

| HTTP Status Code | Reason |
| ---------------- | ------ |
| 201              | Your child application has been created |
| 400              | Your request was malformed. See the reasons in the body for details |
| 403              | Your application does not have permission to create child applications |

Upon successful creation of a child application, you will receive a response like:
```
{
	"name": "The display name of the application",
	"description": "A description of what the application does",
	"clientId": "child-application-clientid",
	"clientSecret": "child-application-clientsecret",
	"redirectUris": [
	    "https://endpoint.one/auth/cb",
	    "https://endpoint.two/login/callback"
	]
}
```

The `name`, `description` and `redirectUris` are confirmation of what was received from your request. The `clientId` 
and `clientSecret` are what the child application will need to use when performing OIDC processes. You will also need
the `clientId` for any later management of the application.

If a child application's secret get compromised, you can request that the secret be regenerated by:
 ```
 POST https://environment-url/services/client-id-of-child-application/regenerate-secret
 Authorization: bearer {jwt-token}
 ```
 
 Possible response codes are:
 
| HTTP Status Code | Reason |
| ---------------- | ------ |
| 200              | Secret has been regenerated |
| 403              | The specified client id is not a child of your application |
| 404              | No application can be found with the specified client id |

Upon successful regeneration of the secret, you will receive a response like:
```
{
    "clientSecret": "regenerated-client-secret"
}
```

## Child application Grants and Tokens

Child applications follow and explicit consent flow that ultimatly yields and Authorization code (a Grant) which can be exchanged for a short lived Access Token and a longer lived Refresh Token, in order to allow child application owners to manage the lifecycle of issued tokens we provide a convienient api to list grants and tokend issues for a goven child application.

These tokens can then be inspected and revoked using the standard open id connect endpoints (intropection and revocaton).

To get a list of grants for a given child service:
```
GET https://environment-url/services/{service-id}/grants
```

To get a list of tokens issued for a given child service grant:
```
GET https://environment-url/services/{service-id}/grants/{grant-id}/tokens
```


## Get user access to service
You can use this API to get a user's access to a service for an organisation.
The request looks like
```
GET https://environment-url/services/{service-id}/organisations/{organisation-id}/users/{user-id}
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name                  | Location | Required | Description |
| --------------------- | -------- | -------- | ----------- |
| service-id            | URL      | Y        | The DfE Sign-in identifier for the service |
| organisation-id       | URL      | Y        | The DfE Sign-in identifier for the organisation |
| user-id               | URL      | Y        | The DfE Sign-in identifier for the user |
| jwt-token             | Header   | Y        | The JWT token for authorization. You will be given a secret to use to sign the token |


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

## Get organisations for user
You can use this API to get the organisations associated with a user
The request looks like
```
GET https://environment-url/users/{user-id}/organisations
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name                  | Location | Required | Description |
| --------------------- | -------- | -------- | ----------- |
| user-id               | URL      | Y        | The DfE Sign-in identifier for the user |
| jwt-token             | Header   | Y        | The JWT token for authorization. You will be given a secret to use to sign the token |

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

### Service Users without filters

You can get a list of users without filters for a given service as defined in the authorisation token (iss attribute)  
The request looks like:    
```
GET https://environment-url/users?page=1&pageSize=25
Authorization: bearer {jwt-token}
```

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).

The response body contains the following attributes (example response below):  

| Name                  | Description |
| --------------------- | -------- |
| users              | An array of user details (including a child organisation object)      |
| numberOfRecords             | Total number of records reported   |
| page             | Current page number  | 
| numberOfPages             | Total number of pages  |

*Response Example*
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
                "createdAt": "2019-02-20T14:27:59.020Z",
                "updatedAt": "2019-02-20T14:28:38.223Z"
            },
            "roleName": "Approver",
            "roleId": 10000,
            "userId": "21D62132-6570-4E63-9DCB-137CC35E7543",
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

### Service Users with filters

You can get a list of users with filters for a given service as defined in the authorisation token (iss attribute)  
The request looks like:    
```
GET https://environment-url/users?page=1&pageSize=25&status=0&from=2021%2F02%2F11%2002%3A22%3A06&to=2021%2F11%2F03%2002%3A22%3A06
Authorization: bearer {jwt-token}
```

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).
The status, from and to are optional 
status accepts 0 at the moment.
date range only accepts 7 days 
dates should be in URL encoded form as shown in the example

*Date range validation*
Send error message when the date range is more than 7 days.
Only from date in the filter gets users updated 7 days after the from date.
Only to date in the filter gets users updated 7 days before the to date.
When no date specified, gets users updated from now to 7 days before it. 

The response body contains the following attributes (example response below):  

| Name                  | Description |
| --------------------- | -------- |
| users              | An array of user details (including a child organisation object)      |
| numberOfRecords             | Total number of records reported   |
| page             | Current page number  | 
| numberOfPages             | Total number of pages  |
| warning (optional)             | appears only when fetching only 7 days of users  |

*Response Example*
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
                "createdAt": "2019-02-20T14:27:59.020Z",
                "updatedAt": "2019-02-20T14:28:38.223Z"
            },
            "roleName": "Approver",
            "roleId": 10000,
            "userId": "21D62132-6570-4E63-9DCB-137CC35E7543",
            "email": "foo@example.com",
            "familyName": "Johnson",
            "givenName": "Roger"
        }
    ],
    "numberOfRecords": 1,
    "page": 1,
    "numberOfPages": 1,
    "warning":  "Only 7 days of data can be fetched"
}
```

To interpret the category id, see [here](#how-do-ids-map-to-categories-and-types).

### Approvers for organisations

You can get a list of approvers for organisations that are within your services scope (based on role policy conditions)
if your service has permission to do so.

The request looks like:    
```
GET https://environment-url/users/approvers?page=1&pageSize=25
Authorization: bearer {jwt-token}
```

The page and pageSize variables are optional and default to 1 and 25 respectively, these variables allow the caller to iterate over pages of results (using attributes in the response body to calculate the number of records and pages).

The response body contains the following attributes (example response below):  

| Name                  | Description |
| --------------------- | -------- |
| users                 | An array of user details (including a child organisation object)      |
| numberOfRecords       | Total number of records reported   |
| page                  | Current page number  | 
| numberOfPages         | Total number of pages  |

*Response Example*

possible response codes are:

| HTTP Status Code | Reason |
| ---------------- | ------ |
| 200              | Your request has been accepted |
| 400              | Your request is not valid. Details will be included in the body |
| 401              | Your JWT is missing or not valid. |
| 403              | Your application does not have permission to get approvers for organisations |
| 500              | Something has gone wrong on server. If the problem continues contact the team |


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
                "companyRegistrationNumber": "1234567"
            },
            "roleId": 10000,
            "roleName": "Approver",
            "userId": "21D62132-6570-4E63-9DCB-137CC35E7543",
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
## Get organisation users by roles
You can use this API to get the organisations users filtering by roles
The request looks like
```
GET https://environment-url/organisations/{UKPRN}/users?roles=role1,role2
Authorization: bearer {jwt-token}
```

The variable data items are:

| Name                  | Location | Required | Description |
| --------------------- | -------- | -------- | ----------- |
| UKPRN                 | URL      | Y        | UKPRN for the organisation |
| roles                 | URL      | N        | User role codes to filter organisation user's list |
| jwt-token             | Header   | Y        | The JWT token for authorization. You will be given a secret to use to sign the token |

This will return a response in the following format
```
{
    "ukprn": "organisation-ukprn-id",
    "users": [
        {
            "email": "user1@test.com",
            "firstName": "user1",
            "lastName": "test",
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

## How do ids map to categories and types?

#### Organisation Categories

| id  | Description |
| --- | ----------- |
| 001 | Establishment (see [Establishment Types](#establishment-types) below) |
| 002 | Local Authority|
| 003 | Other Legacy Organisations|
| 004 | Early Year Setting|
| 008 | Other Stakeholders|
| 009 | Training Providers|
| 010 | Multi-Academy Trust|
| 011 | Government|
| 012 | Other GIAS Stakeholder|
| 013 | Single-Academy Trust|
| 050 | Software Suppliers|
| 051 | Further Education|


#### Establishment Types

| id  | Description |
| --- | ----------- |
| 001 | Community School|
| 002 | Voluntary Aided School|
| 003 | Voluntary Controlled School|
| 005 | Foundation School|
| 006 | City Technology College|
| 007 | Community Special School|
| 008 | Non-Maintained Special School|
| 010 | Other Independent Special School|
| 011 | Other INdependent School|
| 012 | Fondation Special School|
| 014 | Pupil Referral Unit|
| 015 | LA Nursery School|
| 018 | Further Education|
| 024 | Secure Units|
| 025 | Offshore Schools|
| 026 | Service Childrens Education|
| 027 | Miscellanenous|
| 028 | Academy Sponsor Led|
| 029 | Higher Education Institution|
| 030 | Welsh Establishment|
| 031 | Sixth Form Centres|
| 032 | Special Post 16 Institution|
| 033 | Academy Special Sponsor Led|
| 034 | Academy Converter|
| 035 | Free Schools|
| 036 | Free Schools Special|
| 037 | British Overseas Schools|
| 038 | Free Schools - Alternative Provision|
| 039 | Free Schools - 16-19|
| 040 | University Teachnical College|
| 041 | Studio Schools|
| 042 | Academy Alternative Provision Converter|
| 043 | Academy Alternative Provision Sponsor Led|
| 044 | Academy Special Converter|
| 045 | Academy 16-19 Converter|
| 046 | Academy 16-19 Sponsor Led|
| 047 | Children's Centre|
| 048 | Children's Centre Linked Site|
| 056 | Institution funded by other government department|
| 057 | Academy secure 16 to 19|