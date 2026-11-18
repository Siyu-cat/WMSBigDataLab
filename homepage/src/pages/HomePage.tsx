import Hero from '../components/Hero';
import ContentSection from '../components/ContentSection';

const HomePage: React.FC = () => {
  return (
    <main style={{ background: '#F0F1F5', minHeight: '100vh' }}>
      {/* 第④步：Hero 区（背景图 + 标题 + 搜索框） */}
      <Hero />

      {/* 第⑤步：两段文字介绍区 */}
      <ContentSection
        heading="站点介绍"
        subheading="Introduction"
        cardTitle="未名市大数据中心"
        body="未名市大数据中心是由玩家自行做的未定事件簿wiki网站，"
      />
      <ContentSection
        heading="内容板块"
        subheading="Sections"
        cardTitle="更多内容建设中"
        body="未名市大数据中心是由玩家自行做的未定事件簿wiki网站，"
      />
    </main>
  );
};

export default HomePage;
