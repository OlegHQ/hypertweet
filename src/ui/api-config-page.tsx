import { Layout } from "./layout";
import ApiConfig from "./api-config";
import { PageHeader } from "./components/page-header";
export default function ApiConfigPage() {
  return (
    <Layout>
      <PageHeader title="API Config" backRoute="/" />
      <ApiConfig />
    </Layout>
  );
}
