import { ApolloServer, HeaderMap } from '@apollo/server';
import { NextRequest, NextResponse } from 'next/server';
import { typeDefs } from '../../../graphql/schema';
import { resolvers } from '../../../graphql/resolvers';
import { verifyToken } from '../../../lib/jwt';

// Define context type
interface Context {
  userId?: string;
}

// Instantiate Apollo Server
const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

// A helper to make sure the server starts exactly once
let serverStarted = false;
async function ensureServerStarted() {
  if (!serverStarted) {
    try {
      await server.start();
      serverStarted = true;
    } catch (error: any) {
      // If server is already started or starting, ignore the error
      if (!error.message.includes('already')) {
        throw error;
      }
      serverStarted = true;
    }
  }
}

async function handleGraphQLRequest(req: NextRequest) {
  await ensureServerStarted();

  // Parse JWT token from authorization header
  const authHeader = req.headers.get('authorization') || '';
  let userId: string | undefined;
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      userId = decoded.userId;
    }
  }

  const url = new URL(req.url);

  // Map Web Headers to Apollo Server HeaderMap
  const apolloHeaders = new HeaderMap();
  req.headers.forEach((value, key) => {
    apolloHeaders.set(key, value);
  });

  let httpGraphQLResponse;

  try {
    if (req.method === 'GET') {
      httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: 'GET',
          headers: apolloHeaders,
          search: url.search,
          body: null,
        },
        context: async () => ({ userId }),
      });
    } else {
      const body = await req.json();
      httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: 'POST',
          headers: apolloHeaders,
          search: url.search,
          body,
        },
        context: async () => ({ userId }),
      });
    }
  } catch (err: any) {
    return NextResponse.json({ errors: [{ message: err.message }] }, { status: 500 });
  }

  const responseHeaders = new Headers();
  for (const [key, value] of httpGraphQLResponse.headers) {
    responseHeaders.set(key, value);
  }

  // Set standard CORS headers
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (httpGraphQLResponse.body.kind === 'complete') {
    return new NextResponse(httpGraphQLResponse.body.string, {
      status: httpGraphQLResponse.status || 200,
      headers: responseHeaders,
    });
  } else {
    // If the body is chunked/multipart (e.g. defer, stream)
    const iterator = httpGraphQLResponse.body.asyncIterator;
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of iterator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });
    return new NextResponse(stream, {
      status: httpGraphQLResponse.status || 200,
      headers: responseHeaders,
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, {
    status: 200,
    headers: responseHeaders,
  });
}

export { handleGraphQLRequest as GET, handleGraphQLRequest as POST };
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
