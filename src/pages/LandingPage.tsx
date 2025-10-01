import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center animate-rainbow">
      <div className="text-center p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="emoji-huge mb-6">🏠✨</div>
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg animate-bounce-fun">
            おてつだい
            <br />
            だいさくせん！
          </h1>
          <p className="text-2xl text-white font-bold drop-shadow-md">
            🎯 おてつだいして おこづかいを もらおう！ 💰
          </p>
        </div>

        <div className="card-fun mb-8 hover-grow">
          <h2 className="text-2xl font-bold mb-6 text-fun animate-wiggle">
            🌟 できること 🌟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-4 border-2 border-green-300">
              <div className="emoji-large mb-2">🧹</div>
              <div className="font-bold text-green-700">おてつだいして</div>
              <div className="text-green-600">おこづかいゲット！</div>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-300">
              <div className="emoji-large mb-2">🎯</div>
              <div className="font-bold text-purple-700">もくひょうを</div>
              <div className="text-purple-600">たてて ちょきん！</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 border-2 border-yellow-300">
              <div className="emoji-large mb-2">📈</div>
              <div className="font-bold text-orange-700">とうしを</div>
              <div className="text-orange-600">べんきょう！</div>
            </div>
            <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl p-4 border-2 border-red-300">
              <div className="emoji-large mb-2">👨‍👩‍👧‍👦</div>
              <div className="font-bold text-red-700">かぞくみんなで</div>
              <div className="text-red-600">たのしく つかえる！</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleStart}
            className="btn-fun text-2xl py-6 px-12 animate-bounce hover:animate-pulse"
          >
            🚀 はじめる 🚀
          </button>

          <div className="flex justify-center space-x-4 text-4xl animate-wiggle">
            <span>🎉</span>
            <span>✨</span>
            <span>🌟</span>
            <span>🎈</span>
            <span>🎊</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;