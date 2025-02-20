import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    console.log("middleware running");
    const { pathname } = req.nextUrl;
    const isAuth = !!req.cookies.get("next-auth.session-token");

    if (!isAuth && ["/data", "/timer"].includes(pathname)) {
      console.log("redirecting unauthed user to home");
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (isAuth && ["/", "/login", "/register"].includes(pathname)) {
      console.log("redirecting authed user to timer");
      return NextResponse.redirect(new URL("/timer", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  });

export const config = {
  matcher: ['/timer', '/data']
};