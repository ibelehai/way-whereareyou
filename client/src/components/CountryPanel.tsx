import type { Story } from '../types';

interface CountryPanelProps {
  countryCode: string | null;
  countryName: string;
  stories: Story[];
  loading: boolean;
  onClose: () => void;
}

export function CountryPanel({ countryCode, countryName, stories, loading, onClose }: CountryPanelProps) {
  console.log(countryCode,' ss');
  
  if (!countryCode) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-y-auto z-50">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{countryName}</h2>
        <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : stories.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">No stories from this country yet.</p>
        ) : (
          stories.map((story) => (
            <div key={story.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
              {story.photo_url && (
                <img src={story.photo_url} alt="Story" className="w-full h-48 object-cover rounded-md mb-3" />
              )}
              <p className="text-sm font-semibold text-gray-700">
                {story.author_name}
              </p>
              {story.story && <p className="mt-2 text-gray-800">{story.story}</p>}
              <p className="mt-2 text-xs text-gray-500">
                {new Date(story.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
