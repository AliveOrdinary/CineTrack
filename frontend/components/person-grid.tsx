import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/services/tmdb';
// Import Shadcn components & Icon
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from 'lucide-react'; // Import User icon for placeholder

interface Person {
  id: number;
  name: string;
  profile_path?: string | null;
  character?: string; // For cast
  job?: string; // For crew
}

interface PersonGridProps {
  title: string;
  people: Person[];
  itemType?: 'cast' | 'crew'; // To adjust link or display slightly if needed
}

export default function PersonGrid({ title, people, itemType = 'cast' }: PersonGridProps) {
  if (!people || people.length === 0) {
    return null; // Don't render anything if no people data
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {people.map((person) => (
          // Use Card as the root element for each person
          <Card 
             key={person.id} 
             className="group overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Link wraps the content inside the card */}
            <Link
              // href={`/person/${person.id}`} // Future link
              href={`/search?query=${encodeURIComponent(person.name)}&type=person`} 
              className="contents" // Use contents to make link layout properly
            >
              {/* Use AspectRatio for the image */}
              <AspectRatio ratio={2 / 3} className="bg-gray-800"> {/* Add bg color to AspectRatio for fallback bg */}
                 {/* Use Avatar components for image and fallback */}
                 <Avatar className="relative h-full w-full rounded-none"> {/* Avatar fills AspectRatio */} 
                    <AvatarImage 
                      src={getImageUrl(person.profile_path ?? null, 'w500')} 
                      alt={person.name}
                      className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <AvatarFallback className="flex h-full w-full items-center justify-center rounded-none bg-gray-800 text-gray-500">
                       <User className="w-12 h-12" />
                    </AvatarFallback>
                  </Avatar>
              </AspectRatio>
            </Link>
            {/* CardContent holds the text below the image */}
            <CardContent className="p-2">
               {/* Wrap text in link as well */} 
              <Link href={`/search?query=${encodeURIComponent(person.name)}&type=person`}> 
                 <h3 className="font-semibold truncate text-sm group-hover:text-blue-400 transition-colors" title={person.name}>{person.name}</h3>
              </Link>
              {person.character && (
                <p className="text-xs text-gray-400 truncate" title={person.character}>{person.character}</p>
              )}
               {person.job && (
                <p className="text-xs text-gray-400 truncate" title={person.job}>{person.job}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 