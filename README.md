# DfE Login Public Api
[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.public-api.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.public-api)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest) [![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)

API for external consumers to interact with DfE login


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

| Attribute   | Required   | Description                                             |
| ----------- | ---------- | ------------------------------------------------------- |
| messageId   | Y          | Identifier for message in origin system. Must be unique |
| urn         | Y (Or uid) | Establishment URN                                       |
| uid         | Y (Or urn) | Group UID                                               |
| type        | Y          | The numeric type code of the message (see below)        |
| title       | Y          | Title of the announcement                               |
| summary     | Y          | Summary of the announcement                             |
| body        | Y          | Body of the announcement                                |
| publishedAt | Y          | Date/time announcement published at                     |
| expiresAt   |            | Date/time announcement should expire at                 |

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