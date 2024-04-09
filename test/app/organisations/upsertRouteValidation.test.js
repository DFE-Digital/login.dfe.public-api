const request = require('supertest');
const { mockConfig, mockLogger } = require('../../utils');
const { app } = require('../../../src/app');

// Mock dependencies, including middleware.
jest.mock('../../../src/infrastructure/config', () => mockConfig());
jest.mock('../../../src/infrastructure/logger', () => mockLogger());
jest.mock('../../../src/app/utils', () => ({
  auth: jest.fn().mockImplementation(() => (req, res, next) => next()),
  requestCorrelation: jest.fn().mockImplementation(() => (req, res, next) => next()),
}));
jest.mock('login.dfe.dao', () => jest.fn());

/*
 'messageId must be a valid UUID'
  'urn must be numeric type'
  'uid must be a valid UUID'
  'type must be an integer'
  'title field cannot be more than 255 characters'
  'summary field cannot be more than 340 characters'
  'body field cannot be more than 5000 characters'
  'publishedAt is not a valid ISO8601 format'
  'expiresAt is not a valid ISO8601 format'
 */

// POST /organisations/announcements
describe('When providing invalid body to upsert an announcement via /organisations/announcements', () => {
  const body = {
    messageId: 'b69e1cbf', // -97c8-4c2f-a16a-df5c5b4e6ade',
    urn: '123456K',
    uid: '',
    type: 21,
    title: '<p>The great announcement. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ut sapien eros. Aenean dignissim erat ac libero bibendum faucibus. Quisque aliquet auctor sapien, sed dapibus quam. Nullam tempus arcu enim, sit amet consequat ipsum. </p>',
    summary: '<div><p>This is a summary. Duis sagittis elit sit amet ante finibus, id fermentum augue condimentum. Mauris tincidunt convallis vehicula. Vivamus vitae elit fringilla, tempus orci nec, ornare sapien. Sed gravida quam non orci vulputate elementum. Morbi eget blandit tellus. Curabitur pharetra est a accumsan auctor. Sed eu rutrum justo.</p></div>',
    body: '<div><p>This is a announcement body. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ut sapien eros. Aenean dignissim erat ac libero bibendum faucibus. Quisque aliquet auctor sapien, sed dapibus quam. Nullam tempus arcu enim, sit amet consequat ipsum rutrum non. Nam non lacus nulla. In et felis non sem interdum vehicula sed nec eros. Nam luctus vitae nibh nec vulputate. In sem eros, molestie id sagittis a, pharetra quis odio. Sed maximus nisi libero, condimentum tincidunt mauris eleifend sed. In sagittis accumsan lorem vitae bibendum. Vivamus leo metus, feugiat vitae velit id, ornare hendrerit ex. Cras ac mi sollicitudin mauris viverra posuere. Nam et porta urna.'
    + 'Duis sagittis elit sit amet ante finibus, id fermentum augue condimentum. Mauris tincidunt convallis vehicula. Vivamus vitae elit fringilla, tempus orci nec, ornare sapien. Sed gravida quam non orci vulputate elementum. Morbi eget blandit tellus. Curabitur pharetra est a accumsan auctor. Sed eu rutrum justo, eu lobortis diam. Suspendisse purus arcu, egestas quis tempus nec, molestie ut augue. Aliquam dictum fermentum velit et commodo. Vivamus convallis, augue sed sollicitudin placerat, sem elit rutrum ipsum, vitae vehicula sem dolor vitae ipsum. Suspendisse in gravida libero. Morbi at magna metus. Etiam nibh nulla, posuere a nibh eget, pellentesque imperdiet nisl. Proin nec tortor viverra, fringilla velit a, lacinia lacus. Curabitur a aliquam mi.'
    + 'Vivamus bibendum ullamcorper dolor, id accumsan augue lacinia a. Quisque ex ex, tincidunt nec enim id, gravida tempor purus. Phasellus imperdiet ullamcorper justo, vel semper nunc lobortis at. Phasellus tellus massa, ultricies vel fermentum at, ultricies at est. Duis velit dolor, faucibus a tincidunt nec, scelerisque nec sapien. Donec sit amet vehicula diam. Duis eros mauris, laoreet nec luctus et, vulputate id felis. Praesent vitae scelerisque nisl. Ut sodales cursus eros vel luctus. Proin eu eleifend libero. Nam ornare vel sem ullamcorper egestas. Sed vestibulum velit sed ante porttitor, at volutpat massa suscipit. Pellentesque scelerisque rhoncus ante, in condimentum metus pulvinar vitae. In hac habitasse platea dictumst. Quisque suscipit velit id bibendum fermentum.'
    + 'In tempor ultrices finibus. Sed erat nunc, tempus sollicitudin eleifend quis, egestas ac mi. Nullam egestas, turpis eu porttitor cursus, neque sapien pharetra ipsum, eu vestibulum est quam quis odio. Aenean blandit lobortis massa id scelerisque. In lobortis leo vitae molestie aliquam. Sed pharetra lorem sit amet libero ultrices, eget maximus mauris ultricies. Donec finibus mauris sed aliquet porttitor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris ullamcorper sem leo, eu condimentum mauris volutpat quis. Donec a nisl sed velit blandit tempus vel eget metus.'
    + 'Duis quam ante, sollicitudin in turpis vitae, pretium accumsan felis. Proin rhoncus, tellus et pellentesque pulvinar, orci urna pretium nisi, ac placerat velit libero ut turpis. Praesent faucibus ultrices lacus eu faucibus. Etiam non mi libero. Maecenas id lacinia diam, condimentum gravida ante. Curabitur augue ipsum, faucibus in justo ut, scelerisque euismod nunc. Praesent facilisis augue non enim hendrerit iaculis. Pellentesque metus urna, dictum vitae mi gravida, tincidunt commodo metus. Ut porttitor porttitor felis, non consectetur nisi gravida id. Proin consequat nisl ac ligula ornare, non maximus nibh imperdiet. Suspendisse pulvinar fringilla libero non venenatis. Praesent tincidunt mi accumsan tortor interdum, nec commodo ligula placerat. Mauris mi sapien, molestie in posuere id, fringilla a libero. Nulla mattis lacus pellentesque nisi posuere congue. Suspendisse vitae ipsum ante. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ut sapien eros. Aenean dignissim erat ac libero bibendum faucibus. Quisque aliquet auctor sapien, sed dapibus quam. Nullam tempus arcu enim, sit amet consequat ipsum rutrum non. Nam non lacus nulla. In et felis non sem interdum vehicula sed nec eros. Nam luctus vitae nibh nec vulputate. In sem eros, molestie id sagittis a, pharetra quis odio. Sed maximus nisi libero, condimentum tincidunt mauris eleifend sed. In sagittis accumsan lorem vitae bibendum. Vivamus leo metus, feugiat vitae velit id, ornare hendrerit ex. Cras ac mi sollicitudin mauris viverra posuere. Nam et porta urna.'
    + 'Duis sagittis elit sit amet ante finibus, id fermentum augue condimentum. Mauris tincidunt convallis vehicula. Vivamus vitae elit fringilla, tempus orci nec, ornare sapien. Sed gravida quam non orci vulputate elementum. Morbi eget blandit tellus. Curabitur pharetra est a accumsan auctor. Sed eu rutrum justo, eu lobortis diam. Suspendisse purus arcu, egestas quis tempus nec, molestie ut augue. Aliquam dictum fermentum velit et commodo. Vivamus convallis, augue sed sollicitudin placerat, sem elit rutrum ipsum, vitae vehicula sem dolor vitae ipsum. Suspendisse in gravida libero. Morbi at magna metus. Etiam nibh nulla, posuere a nibh eget, pellentesque imperdiet nisl. Proin nec tortor viverra, fringilla velit a, lacinia lacus. Curabitur a aliquam mi.'
    + 'Vivamus bibendum ullamcorper dolor, id accumsan augue lacinia a. Quisque ex ex, tincidunt nec enim id, gravida tempor purus. Phasellus imperdiet ullamcorper justo, vel semper nunc lobortis at. Phasellus tellus massa, ultricies vel fermentum at, ultricies at est. Duis velit dolor, faucibus a tincidunt nec, scelerisque nec sapien. Donec sit amet vehicula diam. Duis eros mauris, laoreet nec luctus et, vulputate id felis. Praesent vitae scelerisque nisl. Ut sodales cursus eros vel luctus. Proin eu eleifend libero. Nam ornare vel sem ullamcorper egestas. Sed vestibulum velit sed ante porttitor, at volutpat massa suscipit. Pellentesque scelerisque rhoncus ante, in condimentum metus pulvinar vitae. In hac habitasse platea dictumst. Quisque suscipit velit id bibendum fermentum.'
    + 'In tempor ultrices finibus. Sed erat nunc, tempus sollicitudin eleifend quis, egestas ac mi. Nullam egestas, turpis eu porttitor cursus, neque sapien pharetra ipsum, eu vestibulum est quam quis odio. </p></div>',
    publishedAt: '2022-08-0214:49:00Z',
    expiresAt: '2022-08-0214:49:00Z',
  };

  it('Response body returns error in reasons object', async () => {
    const response = await request(app)
      .post('/organisations/announcements')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsb2NhbCIsImF1ZCI6InNpZ25pbi5lZHVjYXRpb24uZ292LnVrIiwic3ViIjoiZjQ0NWViMDctZjI2YS00OWY4LWI3YzgtZDlmZjBmYWVjZTljIn0.9V8qjbDSE_4pwKBL8xJViBQmhPAqc99_ZOXPmle0NLI')
      .send(body)
      .expect(400);

    expect(response.body.reasons.includes('body field cannot be more than 5000 characters')).toBe(true);
    expect(response.body.reasons.includes('expiresAt is not a valid ISO8601 format')).toBe(true);
    expect(response.body.reasons.includes('messageId must be a valid UUID')).toBe(true);
    expect(response.body.reasons.includes('publishedAt is not a valid ISO8601 format')).toBe(true);
    expect(response.body.reasons.includes('summary field cannot be more than 340 characters')).toBe(true);
    expect(response.body.reasons.includes('title field cannot be more than 255 characters')).toBe(true);
    expect(response.body.reasons.includes('type must be one of 1, 2, 4, 5. Received 21')).toBe(true);
    expect(response.body.reasons.includes('urn must be numeric type')).toBe(true);
  });
});
