import { useEffect } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';
import PrivateConsoleEntry from '@/pages/private-console-entry';
import { LoginPage, RegisterPage, TransactionPasswordPage } from '@/pages/auth-pages';
import { SessionLoading, SessionProvider, useSession } from '@/session';
import { MemberProvider, useMember } from '@/pages/member/member-context';
import Account from '@/pages/member/Account';
import Home from '@/pages/member/Home';
import Investments from '@/pages/member/Investments';
import Notice from '@/pages/member/Notice';
import Forum from '@/pages/member/Forum';
import Publish from '@/pages/member/Publish';
import Missions from '@/pages/member/Missions';
import Lottery from '@/pages/member/Lottery';
import Recharge from '@/pages/member/Recharge';
import Withdraw from '@/pages/member/Withdraw';
import MobileMoney from '@/pages/member/MobileMoney';
import Orders from '@/pages/member/Orders';
import FinancialHistory from '@/pages/member/FinancialHistory';
import { InvitationPage, TeamPage, TeamMembersPage } from '@/pages/member/Team';
import ProfileSettings from '@/pages/member/ProfileSettings';
import PasswordSettings from '@/pages/member/PasswordSettings';
import Help from '@/pages/member/Help';
import About from '@/pages/member/About';
import Vip from '@/pages/member/Vip';
import SupportChat from '@/pages/member/SupportChat';

const memberPaths = ['/dashboard','/account','/my','/home','/investments','/invest','/notice','/forum','/publish','/missions','/tasks','/lottery','/announcement','/recharge','/withdraw','/bankCardInfo','/orders','/withdrawalRecord','/withdrawalrecord','/balanceDetails','/balanceHistory','/info','/password','/help','/support','/about','/vip','/tradePassword','/transaction-password','/invitation','/team','/team/1','/team/2','/team/3'];
function LotteryPage() {
  const { overview } = useMember();
  return <Lottery overview={overview}/>;
}
function MemberPages() {
  return <MemberProvider><Switch>
    <Route path="/dashboard" component={Account}/>
    <Route path="/account" component={Account}/>
    <Route path="/my" component={Account}/>
    <Route path="/home">{() => <Home/>}</Route>
    <Route path="/announcement">{() => <Home announcement/>}</Route>
    <Route path="/investments" component={Investments}/>
    <Route path="/invest" component={Investments}/>
    <Route path="/notice" component={Notice}/>
    <Route path="/invitation" component={InvitationPage}/>
    <Route path="/team" component={TeamPage}/>
    {[1, 2, 3].map(level => <Route key={level} path={`/team/${level}`}>{() => <TeamMembersPage key={level} level={level}/>}</Route>)}
    <Route path="/forum" component={Forum}/>
    <Route path="/publish" component={Publish}/>
    <Route path="/missions" component={Missions}/>
    <Route path="/tasks" component={Missions}/>
    <Route path="/lottery" component={LotteryPage}/>
    <Route path="/recharge" component={Recharge}/>
    <Route path="/withdraw" component={Withdraw}/>
    <Route path="/bankCardInfo" component={MobileMoney}/>
    <Route path="/orders" component={Orders}/>
    <Route path="/withdrawalRecord">{() => <FinancialHistory kind="withdrawals"/>}</Route>
    <Route path="/withdrawalrecord">{() => <FinancialHistory kind="withdrawals"/>}</Route>
    <Route path="/balanceDetails">{() => <FinancialHistory kind="recharges"/>}</Route>
    <Route path="/balanceHistory">{() => <FinancialHistory kind="balance"/>}</Route>
    <Route path="/info" component={ProfileSettings}/>
    <Route path="/password">{() => <PasswordSettings kind="login"/>}</Route>
    <Route path="/tradePassword">{() => <PasswordSettings kind="transaction"/>}</Route>
    <Route path="/transaction-password">{() => <PasswordSettings kind="transaction"/>}</Route>
    <Route path="/help" component={Help}/>
    <Route path="/support" component={SupportChat}/>
    <Route path="/about" component={About}/>
    <Route path="/vip" component={Vip}/>
  </Switch></MemberProvider>;
}

function RoutedPages() {
  const [location, setLocation] = useLocation();
  const { user, status } = useSession();

  useEffect(() => {
    if (status !== 'ready') return;
    const authPage = location === '/' || location === '/register' || location === '/login';
    const privatePage = location === '/tradePassword' || location === '/transaction-password' || memberPaths.includes(location);
    if (user && authPage) {
      setLocation(user.transactionPasswordSet ? '/dashboard' : '/tradePassword');
    } else if (!user && privatePage) {
      setLocation('/login');
    } else if (user && !user.transactionPasswordSet && memberPaths.includes(location) &&
      location !== '/tradePassword' && location !== '/transaction-password') {
      setLocation('/tradePassword');
    }
  }, [location, user, status, setLocation]);

  if (location === '/admin' || location === '/omarshark-junior-panam') {
    return <NotFound />;
  }
  if (!['/','/register','/login','/tradePassword','/transaction-password'].includes(location) && !memberPaths.includes(location)) {
    return <PrivateConsoleEntry key={location} path={location}/>;
  }
  if (status === 'loading') return <SessionLoading />;
  if (status === 'error') return null;
  const transactionPaths = location === '/tradePassword' || location === '/transaction-password';
  const dashboardPaths = memberPaths.includes(location);
  if (transactionPaths) return user
    ? user.transactionPasswordSet ? <MemberPages/> : <TransactionPasswordPage/>
    : null;
  if (dashboardPaths) return user?.transactionPasswordSet ? <MemberPages/> : null;

  return <Switch>
    <Route path="/" component={RegisterPage} />
    <Route path="/register" component={RegisterPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/tradePassword" component={TransactionPasswordPage} />
    <Route path="/transaction-password" component={TransactionPasswordPage} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
    <SessionProvider><RoutedPages /></SessionProvider>
  </WouterRouter>;
}

export default App;
