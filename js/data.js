/* =====================================================================
 * 多语种学习平台 - 数据层
 * 涵盖英语 / 日语 / 韩语，分级课程体系 + 互动学习内容 + 成就体系
 * ===================================================================== */

const APP_DATA = {
  /* ---------------- 语言分类 ---------------- */
  languages: {
    english: {
      key: 'english',
      name: '英语',
      nativeName: 'English',
      flag: '🇬🇧',
      tagline: '全球通用语言，连接世界的桥梁',
      color: '#3b82f6',
      learners: '2.1M'
    },
    japanese: {
      key: 'japanese',
      name: '日语',
      nativeName: '日本語',
      flag: '🇯🇵',
      tagline: '动漫与樱花的语言，细腻而优雅',
      color: '#ef4444',
      learners: '860K'
    },
    korean: {
      key: 'korean',
      name: '韩语',
      nativeName: '한국어',
      flag: '🇰🇷',
      tagline: 'K-Pop 与韩剧的语言，活力四射',
      color: '#6366f1',
      learners: '1.2M'
    }
  },

  /* ---------------- CEFR 分级体系 ---------------- */
  levels: [
    { code: 'A1', name: '入门', desc: '掌握基础问候与日常表达', xp: 0, color: '#10b981' },
    { code: 'A2', name: '初级', desc: '能进行简单日常交流', xp: 500, color: '#3b82f6' },
    { code: 'B1', name: '中级', desc: '能应对旅行场景与短文', xp: 1500, color: '#8b5cf6' },
    { code: 'B2', name: '中高级', desc: '能流利表达复杂观点', xp: 3000, color: '#f59e0b' },
    { code: 'C1', name: '高级', desc: '理解隐含意义与长文', xp: 5000, color: '#ef4444' },
    { code: 'C2', name: '精通', desc: '接近母语水平运用', xp: 8000, color: '#ec4899' }
  ],

  /* ---------------- 课程内容 ---------------- */
  courses: {
    /* ============== 英语 ============== */
    english: {
      A1: {
        title: '英语入门 · Hello World',
        goal: '掌握字母、基础问候、自我介绍与数字表达',
        lessons: [
          {
            id: 'en-a1-1',
            title: '第一课：字母与问候',
            type: 'vocabulary',
            words: [
              { word: 'hello', trans: '你好', phonetic: '/həˈloʊ/', example: 'Hello, how are you?' },
              { word: 'goodbye', trans: '再见', phonetic: '/ˌɡʊdˈbaɪ/', example: 'Goodbye, see you tomorrow.' },
              { word: 'thank you', trans: '谢谢', phonetic: '/ˈθæŋk juː/', example: 'Thank you for your help.' },
              { word: 'please', trans: '请', phonetic: '/pliːz/', example: 'Please sit down.' },
              { word: 'sorry', trans: '对不起', phonetic: '/ˈsɒri/', example: 'Sorry, I am late.' },
              { word: 'yes', trans: '是', phonetic: '/jes/', example: 'Yes, I agree.' },
              { word: 'no', trans: '不', phonetic: '/noʊ/', example: 'No, thank you.' },
              { word: 'name', trans: '名字', phonetic: '/neɪm/', example: 'My name is Tom.' }
            ]
          },
          {
            id: 'en-a1-2',
            title: '第二课：自我介绍',
            type: 'grammar',
            grammar: {
              point: '主谓宾基本结构 / be 动词',
              rule: 'I am / You are / He is / She is / We are / They are',
              examples: [
                'I am a student. (我是一名学生)',
                'She is my teacher. (她是我的老师)',
                'They are my friends. (他们是我的朋友)'
              ]
            },
            exercises: [
              { q: '___ am a teacher.', options: ['I', 'She', 'They'], answer: 0, explain: '第一人称单数用 am' },
              { q: 'He ___ my brother.', options: ['am', 'is', 'are'], answer: 1, explain: '第三人称单数用 is' },
              { q: 'They ___ students.', options: ['is', 'am', 'are'], answer: 2, explain: '复数主语用 are' }
            ]
          },
          {
            id: 'en-a1-3',
            title: '第三课：数字与时间',
            type: 'listening',
            audio: [
              { text: 'It is three o\'clock now.', trans: '现在是三点钟。' },
              { text: 'I have two apples and one banana.', trans: '我有两个苹果和一根香蕉。' },
              { text: 'My phone number is five five five.', trans: '我的电话号码是 555。' }
            ],
            questions: [
              { q: 'What time is it now?', options: ['Two', 'Three', 'Four'], answer: 1 },
              { q: 'How many apples does the speaker have?', options: ['One', 'Two', 'Three'], answer: 1 },
              { q: 'What is the last digit of the phone number?', options: ['Three', 'Five', 'Two'], answer: 1 }
            ]
          },
          {
            id: 'en-a1-4',
            title: '第四课：日常对话口语',
            type: 'speaking',
            sentences: [
              { en: 'Hello, nice to meet you.', zh: '你好，很高兴认识你。' },
              { en: 'How are you today?', zh: '你今天怎么样？' },
              { en: 'I am fine, thank you.', zh: '我很好，谢谢。' },
              { en: 'What is your name?', zh: '你叫什么名字？' },
              { en: 'My name is Lily.', zh: '我的名字叫莉莉。' }
            ]
          }
        ]
      },
      A2: {
        title: '英语初级 · Daily Life',
        goal: '掌握日常生活场景对话与常用动词',
        lessons: [
          {
            id: 'en-a2-1',
            title: '第一课：购物场景',
            type: 'vocabulary',
            words: [
              { word: 'shop', trans: '商店', phonetic: '/ʃɒp/', example: 'I go to the shop every day.' },
              { word: 'price', trans: '价格', phonetic: '/praɪs/', example: 'What is the price?' },
              { word: 'expensive', trans: '昂贵的', phonetic: '/ɪkˈspensɪv/', example: 'This is too expensive.' },
              { word: 'cheap', trans: '便宜的', phonetic: '/tʃiːp/', example: 'It is very cheap.' },
              { word: 'money', trans: '钱', phonetic: '/ˈmʌni/', example: 'I have enough money.' },
              { word: 'receipt', trans: '收据', phonetic: '/rɪˈsiːt/', example: 'Can I have a receipt?' }
            ]
          },
          {
            id: 'en-a2-2',
            title: '第二课：一般现在时',
            type: 'grammar',
            grammar: {
              point: '一般现在时 Simple Present',
              rule: '主语 + 动词原形（第三人称单数加 s/es）',
              examples: [
                'I work every day. (我每天工作)',
                'She plays tennis. (她打网球)',
                'We study English. (我们学英语)'
              ]
            },
            exercises: [
              { q: 'She ___ tennis every weekend.', options: ['play', 'plays', 'playing'], answer: 1, explain: '第三人称单数加 s' },
              { q: 'We ___ English at school.', options: ['studies', 'study', 'studys'], answer: 1, explain: '复数主语用原形' },
              { q: 'He ___ to work by bus.', options: ['go', 'goes', 'going'], answer: 1, explain: 'go 的第三人称单数是 goes' }
            ]
          }
        ]
      },
      B1: {
        title: '英语中级 · Express Yourself',
        goal: '表达观点，描述经历，理解短文',
        lessons: [
          {
            id: 'en-b1-1',
            title: '第一课：现在完成时',
            type: 'grammar',
            grammar: {
              point: '现在完成时 Present Perfect',
              rule: 'have/has + 过去分词，表达已完成或经历',
              examples: [
                'I have finished my homework. (我已经完成了作业)',
                'She has been to Japan. (她去过日本)',
                'They have lived here for 10 years. (他们住在这里十年了)'
              ]
            },
            exercises: [
              { q: 'I ___ already ___ my lunch.', options: ['have / eat', 'have / eaten', 'has / eaten'], answer: 1, explain: 'have + 过去分词 eaten' },
              { q: 'She ___ to Paris twice.', options: ['has been', 'have been', 'has gone'], answer: 0, explain: 'has been 表示去过' },
              { q: 'They ___ here since 2010.', options: ['has lived', 'have lived', 'have live'], answer: 1, explain: '复数 + have lived' }
            ]
          },
          {
            id: 'en-b1-2',
            title: '第二课：旅行对话听力',
            type: 'listening',
            audio: [
              { text: 'Excuse me, could you tell me how to get to the museum?', trans: '打扰一下，请问去博物馆怎么走？' },
              { text: 'Go straight ahead and turn left at the second crossing.', trans: '直走然后在第二个路口左转。' },
              { text: 'It takes about ten minutes on foot.', trans: '步行大约需要十分钟。' }
            ],
            questions: [
              { q: 'Where does the person want to go?', options: ['Bank', 'Museum', 'Station'], answer: 1 },
              { q: 'Which direction at the second crossing?', options: ['Left', 'Right', 'Straight'], answer: 0 },
              { q: 'How long does it take on foot?', options: ['5 minutes', '10 minutes', '20 minutes'], answer: 1 }
            ]
          }
        ]
      }
    },

    /* ============== 日语 ============== */
    japanese: {
      A1: {
        title: '日语入门 · こんにちは',
        goal: '掌握五十音、基础问候与自我介绍',
        lessons: [
          {
            id: 'ja-a1-1',
            title: '第一课：五十音图',
            type: 'vocabulary',
            words: [
              { word: 'あ(a)', trans: '阿', phonetic: '/a/', example: 'あい(爱)' },
              { word: 'い(i)', trans: '伊', phonetic: '/i/', example: 'いぬ(狗)' },
              { word: 'う(u)', trans: '乌', phonetic: '/u/', example: 'うみ(海)' },
              { word: 'え(e)', trans: '爱', phonetic: '/e/', example: 'えき(车站)' },
              { word: 'お(o)', trans: '奥', phonetic: '/o/', example: 'おちゃ(茶)' },
              { word: 'か(ka)', trans: '卡', phonetic: '/ka/', example: 'かぜ(风)' },
              { word: 'き(ki)', trans: '基', phonetic: '/ki/', example: 'きぼう(希望)' },
              { word: 'く(ku)', trans: '库', phonetic: '/ku/', example: 'くつ(鞋)' }
            ]
          },
          {
            id: 'ja-a1-2',
            title: '第二课：基础问候',
            type: 'grammar',
            grammar: {
              point: 'です / ます 形（敬体）',
              rule: '名词 + です（是） / 动词ます形（礼貌体）',
              examples: [
                '私は学生です。(我是学生)',
                '私は日本語を勉強します。(我学日语)',
                'これは本です。(这是书)'
              ]
            },
            exercises: [
              { q: '私 ___ 学生 ___。', options: ['は / です', 'が / ます', 'を / です'], answer: 0, explain: 'は提示主题，です是判断助动词' },
              { q: '日本語を ___ 。', options: ['勉強します', '勉強です', '勉強ます'], answer: 0, explain: '动词ます形表示礼貌' },
              { q: 'これ ___ 本 ___。', options: ['は / ます', 'が / です', 'は / です'], answer: 2, explain: '名词句用 です 结尾' }
            ]
          },
          {
            id: 'ja-a1-3',
            title: '第三课：自我介绍听力',
            type: 'listening',
            audio: [
              { text: 'はじめまして、田中です。', trans: '初次见面，我是田中。' },
              { text: '東京から来ました。', trans: '我从东京来。' },
              { text: 'どうぞよろしくお願いします。', trans: '请多关照。' }
            ],
            questions: [
              { q: '说话人姓什么？', options: ['田中', '山田', '佐藤'], answer: 0 },
              { q: '说话人从哪里来？', options: ['大阪', '东京', '京都'], answer: 1 },
              { q: '最后一句是什么意思？', options: ['再见', '谢谢', '请多关照'], answer: 2 }
            ]
          },
          {
            id: 'ja-a1-4',
            title: '第四课：日常问候口语',
            type: 'speaking',
            sentences: [
              { en: 'おはようございます。', zh: '早上好。' },
              { en: 'こんにちは。', zh: '你好。' },
              { en: 'こんばんは。', zh: '晚上好。' },
              { en: 'ありがとうございます。', zh: '非常感谢。' },
              { en: 'すみません。', zh: '对不起 / 不好意思。' }
            ]
          }
        ]
      },
      A2: {
        title: '日语初级 · 毎日の生活',
        goal: '掌握日常生活表达与动词变形',
        lessons: [
          {
            id: 'ja-a2-1',
            title: '第一课：饮食词汇',
            type: 'vocabulary',
            words: [
              { word: 'ご飯(ごはん)', trans: '米饭/饭', phonetic: '/gohan/', example: 'ご飯を食べます。' },
              { word: '水(みず)', trans: '水', phonetic: '/mizu/', example: '水を飲みます。' },
              { word: 'お茶(おちゃ)', trans: '茶', phonetic: '/ocha/', example: 'お茶をどうぞ。' },
              { word: '肉(にく)', trans: '肉', phonetic: '/niku/', example: '肉が好きです。' },
              { word: '野菜(やさい)', trans: '蔬菜', phonetic: '/yasai/', example: '野菜を食べます。' },
              { word: '美味しい(おいしい)', trans: '好吃的', phonetic: '/oishii/', example: 'とても美味しいです。' }
            ]
          },
          {
            id: 'ja-a2-2',
            title: '第二课：て形变形',
            type: 'grammar',
            grammar: {
              point: '動詞のて形（动词て形）',
              rule: '动词变形 + て，表示连接或请求',
              examples: [
                '食べてください。(请吃)',
                '行ってきます。(我去去就回)',
                '読んでから寝ます。(读完再睡)'
              ]
            },
            exercises: [
              { q: '食べる → ___', options: ['食べて', '食べって', '食べいて'], answer: 0, explain: '一段动词去る+て' },
              { q: '行く → ___', options: ['行いて', '行って', '行んで'], answer: 1, explain: 'く→いて为特例：行って' },
              { q: '読む → ___', options: ['読いて', '読んで', '読って'], answer: 1, explain: 'む→んで' }
            ]
          }
        ]
      },
      B1: {
        title: '日语中级 · 表現の広がり',
        goal: '掌握敬语、复杂句型与议论表达',
        lessons: [
          {
            id: 'ja-b1-1',
            title: '第一课：受身形（被动）',
            type: 'grammar',
            grammar: {
              point: '受身形（被动语态）',
              rule: '动词未然形 + れる / られる',
              examples: [
                '私は先生に褒められました。(我被老师表扬了)',
                'この本は多くの人に読まれています。(这本书被很多人读)',
                '雨に降られて風邪をひいた。(被雨淋感冒了)'
              ]
            },
            exercises: [
              { q: '褒める → ___', options: ['褒めれる', '褒められる', '褒められる'], answer: 2, explain: '下一段动词受身：られる' },
              { q: '読む → ___', options: ['読まれる', '読れる', '読られる'], answer: 0, explain: '五段动词あ段+れる' },
              { q: '見る → ___', options: ['見られる', '見される', '見れる'], answer: 0, explain: '上一段动词受身：られる' }
            ]
          }
        ]
      }
    },

    /* ============== 韩语 ============== */
    korean: {
      A1: {
        title: '韩语入门 · 안녕하세요',
        goal: '掌握韩文字母、基础问候与自我介绍',
        lessons: [
          {
            id: 'ko-a1-1',
            title: '第一课：韩文字母',
            type: 'vocabulary',
            words: [
              { word: '아(a)', trans: '啊', phonetic: '/a/', example: '아이(孩子)' },
              { word: '야(ya)', trans: '呀', phonetic: '/ya/', example: '야자(椰子)' },
              { word: '어(eo)', trans: '哦', phonetic: '/ʌ/', example: '어디(哪里)' },
              { word: '여(yeo)', trans: '哟', phonetic: '/jʌ/', example: '여자(女子)' },
              { word: '오(o)', trans: '噢', phonetic: '/o/', example: '오이(黄瓜)' },
              { word: '요(yo)', trans: '哟', phonetic: '/jo/', example: '요리(料理)' },
              { word: '우(u)', trans: '乌', phonetic: '/u/', example: '우유(牛奶)' },
              { word: '유(yu)', trans: '尤', phonetic: '/ju/', example: '유리(玻璃)' }
            ]
          },
          {
            id: 'ko-a1-2',
            title: '第二课：基础问候',
            type: 'grammar',
            grammar: {
              point: '입니다 / 습니다（格式体尊敬阶）',
              rule: '名词 + 입니다（是） / 动词词干 + 습니다（礼貌陈述）',
              examples: [
                '저는 학생입니다.(我是学生)',
                '저는 한국어를 공부합니다.(我学韩语)',
                '이것은 책입니다.(这是书)'
              ]
            },
            exercises: [
              { q: '저 ___ 학생 ___。', options: ['는 / 입니다', '가 / 합니다', '을 / 입니다'], answer: 0, explain: '는提示主题，입니다判断' },
              { q: '한국어를 ___。', options: ['공부합니다', '공부입니다', '공부습니다'], answer: 0, explain: '动词+ㅂ니다' },
              { q: '이것 ___ 책 ___。', options: ['는 / 합니다', '은 / 입니다', '을 / 합니다'], answer: 1, explain: '이것结尾用은' }
            ]
          },
          {
            id: 'ko-a1-3',
            title: '第三课：自我介绍听力',
            type: 'listening',
            audio: [
              { text: '안녕하세요, 저는 김민준입니다.', trans: '你好，我是金敏俊。' },
              { text: '서울에서 왔어요.', trans: '我从首尔来。' },
              { text: '잘 부탁드립니다.', trans: '请多关照。' }
            ],
            questions: [
              { q: '说话人姓什么？', options: ['金', '李', '朴'], answer: 0 },
              { q: '说话人从哪里来？', options: ['釜山', '首尔', '济州'], answer: 1 },
              { q: '最后一句是什么意思？', options: ['再见', '请多关照', '谢谢'], answer: 1 }
            ]
          },
          {
            id: 'ko-a1-4',
            title: '第四课：日常问候口语',
            type: 'speaking',
            sentences: [
              { en: '안녕하세요.', zh: '你好。' },
              { en: '안녕히 가세요.', zh: '再见（对走的人）。' },
              { en: '감사합니다.', zh: '谢谢。' },
              { en: '죄송합니다.', zh: '对不起。' },
              { en: '반갑습니다.', zh: '很高兴见到你。' }
            ]
          }
        ]
      },
      A2: {
        title: '韩语初级 · 일상생활',
        goal: '掌握日常生活表达与动词变化',
        lessons: [
          {
            id: 'ko-a2-1',
            title: '第一课：饮食词汇',
            type: 'vocabulary',
            words: [
              { word: '밥', trans: '饭', phonetic: '/pap/', example: '밥을 먹어요.' },
              { word: '물', trans: '水', phonetic: '/mul/', example: '물을 마셔요.' },
              { word: '커피', trans: '咖啡', phonetic: '/kʰʌpʰi/', example: '커피를 좋아해요.' },
              { word: '고기', trans: '肉', phonetic: '/koɡi/', example: '고기를 구워요.' },
              { word: '야채', trans: '蔬菜', phonetic: '/jatɕʰɛ/', example: '야채를 먹어요.' },
              { word: '맛있다', trans: '好吃', phonetic: '/matʰitta/', example: '정말 맛있어요.' }
            ]
          },
          {
            id: 'ko-a2-2',
            title: '第二课：해요体',
            type: 'grammar',
            grammar: {
              point: '해요体（非格式尊敬阶）',
              rule: '动词词干 + 아요 / 어요 / 해요',
              examples: [
                '먹어요.(吃)',
                '마셔요.(喝)',
                '공부해요.(学习)'
              ]
            },
            exercises: [
              { q: '먹다 → ___', options: ['먹아요', '먹어요', '먹해요'], answer: 1, explain: '으韵母用어요' },
              { q: '가다 → ___', options: ['가어요', '가요', '가해요'], answer: 1, explain: '아/오韵母缩为아요→가요' },
              { q: '하다 → ___', options: ['하여요', '해요', '하여요'], answer: 1, explain: '하다特例为해요' }
            ]
          }
        ]
      },
      B1: {
        title: '韩语中级 · 표현의 확장',
        goal: '掌握复杂句型与议论表达',
        lessons: [
          {
            id: 'ko-b1-1',
            title: '第一课：비교문（比较句）',
            type: 'grammar',
            grammar: {
              point: '보다 / 만큼（比较句）',
              rule: 'A가 B보다 + 形容词 / A가 B만큼 + 形容词',
              examples: [
                '사과보다 배가 더 맛있어요.(梨比苹果更好吃)',
                '서울이 부산만큼 큽니다.(首尔和釜山一样大)',
                '오늘은 어제보다 추워요.(今天比昨天冷)'
              ]
            },
            exercises: [
              { q: '사과 ___ 배 ___ 더 맛있어요.', options: ['보다 / 가', '가 / 보다', '을 / 보다'], answer: 1, explain: '主语在前，비교대상用보다' },
              { q: '오늘은 어제 ___ 추워요.', options: ['만큼', '보다', '처럼'], answer: 1, explain: '보다表示比较' },
              { q: '서울이 부산 ___ 큽니다.', options: ['보다', '만큼', '에서'], answer: 1, explain: '만큼表示同等程度' }
            ]
          }
        ]
      }
    }
  },

  /* ---------------- 成就徽章 ---------------- */
  achievements: [
    { id: 'first-word', icon: '🌱', name: '初识新语', desc: '完成第一节词汇课', xp: 50, tier: 'bronze' },
    { id: 'streak-3', icon: '🔥', name: '热身起步', desc: '连续学习 3 天', xp: 100, tier: 'bronze' },
    { id: 'streak-7', icon: '⚡', name: '一周坚持', desc: '连续学习 7 天', xp: 200, tier: 'silver' },
    { id: 'streak-30', icon: '🏆', name: '月度王者', desc: '连续学习 30 天', xp: 800, tier: 'gold' },
    { id: 'perfect-quiz', icon: '💯', name: '满分达人', desc: '单次练习全对', xp: 150, tier: 'silver' },
    { id: 'speak-10', icon: '🎤', name: '开口说', desc: '完成 10 次口语跟读', xp: 200, tier: 'silver' },
    { id: 'level-up', icon: '📈', name: '步步高升', desc: '通过等级测评', xp: 300, tier: 'gold' },
    { id: 'social-5', icon: '💬', name: '社交达人', desc: '在社区发布 5 条帖子', xp: 150, tier: 'silver' },
    { id: 'polyglot', icon: '🌍', name: '多语通才', desc: '学习 2 种以上语言', xp: 500, tier: 'gold' },
    { id: 'xp-1000', icon: '🌟', name: '千分成就', desc: '累计获得 1000 XP', xp: 500, tier: 'gold' }
  ],

  /* ---------------- 每日挑战 ---------------- */
  dailyChallenges: [
    { id: 'dc-words', name: '背 5 个新单词', xp: 30, type: 'vocabulary' },
    { id: 'dc-grammar', name: '完成 1 组语法练习', xp: 40, type: 'grammar' },
    { id: 'dc-listen', name: '完成 1 次听力训练', xp: 35, type: 'listening' },
    { id: 'dc-speak', name: '完成 3 句口语跟读', xp: 35, type: 'speaking' }
  ],

  /* ---------------- 社区种子数据 ---------------- */
  community: {
    posts: [
      { id: 'p1', author: '语言探险家', avatar: '🦊', lang: 'japanese', time: '2 小时前', title: '分享一个背五十音的小妙招', content: '把あいうえお编成小曲子唱出来，真的超有效！一周就背熟了，大家试试看~', likes: 128, comments: 23 },
      { id: 'p2', author: 'K-Pop迷', avatar: '🐰', lang: 'korean', time: '5 小时前', title: '边听歌边学韩语真的快乐', content: '把喜欢的歌词一句句拆开查词，比死记硬背有趣多了，分享给大家。', likes: 89, comments: 15 },
      { id: 'p3', author: '英语达人Tom', avatar: '🐯', lang: 'english', time: '1 天前', title: 'B2等级经验：一定要多读原版书', content: '从分级读物开始，慢慢过渡到原版小说，语感提升非常明显。', likes: 156, comments: 31 }
    ],
    leaderboard: [
      { rank: 1, name: '语言大师', avatar: '👑', xp: 8650, streak: 42, langs: 3 },
      { rank: 2, name: '勤奋小贝', avatar: '🦉', xp: 7320, streak: 35, langs: 2 },
      { rank: 3, name: '樱花武士', avatar: '🌸', xp: 6890, streak: 28, langs: 2 },
      { rank: 4, name: '首尔之夜', avatar: '🌙', xp: 5410, streak: 21, langs: 1 },
      { rank: 5, name: '英语流利说', avatar: '⭐', xp: 4780, streak: 19, langs: 1 }
    ]
  }
};

window.APP_DATA = APP_DATA;
