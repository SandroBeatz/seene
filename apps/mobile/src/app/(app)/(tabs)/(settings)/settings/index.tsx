import { MenuScreen } from '@/widgets/menu';
import { MoneyMenuSection } from '@/widgets/money';

export default function MenuRoute() {
  return <MenuScreen moneySection={<MoneyMenuSection />} />;
}
