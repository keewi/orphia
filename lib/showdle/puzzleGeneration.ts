/**
 * Showdle puzzle generation.
 *
 * Single source of truth for the curated "top musicals" list used by the
 * puzzle seed/generation scripts. The same const is also used to hydrate the
 * `musicals` table (see `seedMusicalsTable`) so we don't keep two rankings
 * in sync.
 */

export type TopMusical = {
  id: string; // slug, stable
  title: string;
  year: number;
  description: string;
  imageUrl: string | null;
  popularityRank: number;
};

/**
 * Curated top musicals, ordered by mass popularity with deliberate bias
 * toward: recency, Tony wins, and big star names attached.
 *
 * Coverage goal: every musical known to have won ≥3 Tony Awards should be
 * present, regardless of current mainstream popularity. Ordering within
 * that set still reflects recency + star power + cultural reach.
 *
 * Edit this list to rerank — it is the authoritative ranking.
 */
export const TOP_MUSICALS: readonly TopMusical[] = [
  { id: "hamilton", title: "Hamilton", year: 2015, description: "Lin-Manuel Miranda's hip-hop retelling of Alexander Hamilton's life. 11 Tony wins, Pulitzer.", imageUrl: null, popularityRank: 1 },
  { id: "wicked", title: "Wicked", year: 2003, description: "The untold story of the witches of Oz. Idina Menzel & Kristin Chenoweth; Jon M. Chu film 2024.", imageUrl: null, popularityRank: 2 },
  { id: "the-lion-king", title: "The Lion King", year: 1997, description: "Julie Taymor's puppet-driven Disney epic — highest-grossing Broadway show of all time. 6 Tony wins.", imageUrl: null, popularityRank: 3 },
  { id: "maybe-happy-ending", title: "Maybe Happy Ending", year: 2024, description: "Will Aronson & Hue Park's sci-fi romance between two retired helper robots. 6 Tony wins incl. Best Musical 2025; Darren Criss Best Actor.", imageUrl: null, popularityRank: 4 },
  { id: "phantom-of-the-opera", title: "The Phantom of the Opera", year: 1986, description: "Andrew Lloyd Webber's gothic romance; longest-running Broadway show in history. 7 Tony wins.", imageUrl: null, popularityRank: 5 },
  { id: "hadestown", title: "Hadestown", year: 2016, description: "Anaïs Mitchell's folk-opera Orpheus & Eurydice. 8 Tony wins incl. Best Musical 2019.", imageUrl: null, popularityRank: 6 },
  { id: "six", title: "Six", year: 2017, description: "Pop-concert musical reframing Henry VIII's wives as solo artists. Tony-winning and TikTok-viral.", imageUrl: null, popularityRank: 7 },
  { id: "les-miserables", title: "Les Misérables", year: 1980, description: "Boublil & Schönberg's sung-through Hugo adaptation. 8 Tonys; 2012 Hugh Jackman / Anne Hathaway film.", imageUrl: null, popularityRank: 8 },
  { id: "book-of-mormon", title: "The Book of Mormon", year: 2011, description: "Parker, Stone & Lopez satire of missionaries in Uganda. 9 Tony wins.", imageUrl: null, popularityRank: 9 },
  { id: "the-outsiders", title: "The Outsiders", year: 2024, description: "Jamestown Revival & Justin Levine's stage adaptation of the S.E. Hinton novel / Coppola film. 4 Tony wins incl. Best Musical 2024.", imageUrl: null, popularityRank: 10 },
  { id: "dear-evan-hansen", title: "Dear Evan Hansen", year: 2016, description: "A lonely teen's lie spirals into viral connection and grief. 6 Tonys; Ben Platt film.", imageUrl: null, popularityRank: 11 },
  { id: "chicago", title: "Chicago", year: 1975, description: "Kander & Ebb's jazz-age murderesses. Longest-running American musical still on Broadway; Oscar-winning film.", imageUrl: null, popularityRank: 12 },
  { id: "moulin-rouge", title: "Moulin Rouge! The Musical", year: 2018, description: "Jukebox adaptation of Baz Luhrmann's film. 10 Tony wins incl. Best Musical 2020.", imageUrl: null, popularityRank: 13 },
  { id: "mamma-mia", title: "Mamma Mia!", year: 1999, description: "ABBA jukebox musical on a Greek island wedding. Meryl Streep / Pierce Brosnan films.", imageUrl: null, popularityRank: 14 },
  { id: "miss-saigon", title: "Miss Saigon", year: 1989, description: "Boublil & Schönberg's Vietnam-era Madame Butterfly. 3 Tony wins; career-making roles for Lea Salonga and Jonathan Pryce.", imageUrl: null, popularityRank: 15 },
  { id: "mj-the-musical", title: "MJ the Musical", year: 2022, description: "Lynn Nottage's biography of Michael Jackson built around the Dangerous tour. 4 Tony wins incl. Best Actor Myles Frost.", imageUrl: null, popularityRank: 16 },
  { id: "rent", title: "Rent", year: 1996, description: "Jonathan Larson's rock musical about artists in 1990s East Village. 4 Tonys, Pulitzer.", imageUrl: null, popularityRank: 17 },
  { id: "sunset-boulevard", title: "Sunset Boulevard", year: 1993, description: "Lloyd Webber's adaptation of the Billy Wilder film. 7 Tony wins; Nicole Scherzinger Tony-winning 2024 revival.", imageUrl: null, popularityRank: 18 },
  { id: "come-from-away", title: "Come From Away", year: 2015, description: "The true story of Gander, Newfoundland on 9/11. Apple TV+ pro-shot capture.", imageUrl: null, popularityRank: 19 },
  { id: "cats", title: "Cats", year: 1981, description: "Lloyd Webber's T.S. Eliot adaptation. 7 Tony wins; 2019 Tom Hooper film.", imageUrl: null, popularityRank: 20 },
  { id: "sweeney-todd", title: "Sweeney Todd", year: 1979, description: "Sondheim's demon barber of Fleet Street. 8 Tony wins; 2023 Josh Groban revival.", imageUrl: null, popularityRank: 21 },
  { id: "the-band-s-visit", title: "The Band's Visit", year: 2017, description: "Itamar Moses & David Yazbek's quiet story of an Egyptian band stranded in Israel. 10 Tony wins.", imageUrl: null, popularityRank: 22 },
  { id: "fiddler-on-the-roof", title: "Fiddler on the Roof", year: 1964, description: "Tevye's family navigates tradition in tsarist Russia. 9 Tony wins.", imageUrl: null, popularityRank: 23 },
  { id: "west-side-story", title: "West Side Story", year: 1957, description: "Bernstein & Sondheim's Romeo and Juliet on the streets of New York. Spielberg film 2021.", imageUrl: null, popularityRank: 24 },
  { id: "sound-of-music", title: "The Sound of Music", year: 1959, description: "Rodgers & Hammerstein's von Trapp family. 5 Tonys; beloved Julie Andrews film.", imageUrl: null, popularityRank: 25 },
  { id: "aladdin", title: "Aladdin", year: 2011, description: "Disney's stage expansion of the 1992 animated film. Still running on Broadway.", imageUrl: null, popularityRank: 26 },
  { id: "frozen", title: "Frozen", year: 2018, description: "Disney's stage adaptation of the Arendelle sister saga.", imageUrl: null, popularityRank: 27 },
  { id: "beauty-and-the-beast", title: "Beauty and the Beast", year: 1994, description: "Disney's first stage musical, from the animated film.", imageUrl: null, popularityRank: 28 },
  { id: "matilda", title: "Matilda the Musical", year: 2010, description: "Tim Minchin's adaptation of Roald Dahl's gifted-child fable. 4 Tony wins; Netflix film 2022.", imageUrl: null, popularityRank: 29 },
  { id: "waitress", title: "Waitress", year: 2015, description: "Sara Bareilles's score about a pie-baking diner waitress.", imageUrl: null, popularityRank: 30 },
  { id: "hairspray", title: "Hairspray", year: 2002, description: "Marc Shaiman's integration-era Baltimore dance-show comedy. 8 Tony wins; hit film.", imageUrl: null, popularityRank: 31 },
  { id: "in-the-heights", title: "In the Heights", year: 2005, description: "Lin-Manuel Miranda's first Broadway show, set in Washington Heights. 4 Tony wins; 2021 film.", imageUrl: null, popularityRank: 32 },
  { id: "cabaret", title: "Cabaret", year: 1966, description: "Kander & Ebb's Kit Kat Klub against the rise of Nazism. 8 Tony wins; Eddie Redmayne 2024 revival.", imageUrl: null, popularityRank: 33 },
  { id: "my-fair-lady", title: "My Fair Lady", year: 1956, description: "Lerner & Loewe's adaptation of Shaw's Pygmalion. 6 Tony wins.", imageUrl: null, popularityRank: 34 },
  { id: "into-the-woods", title: "Into the Woods", year: 1987, description: "Sondheim & Lapine's fairy-tale mashup. 2022 revival; Disney film with Meryl Streep.", imageUrl: null, popularityRank: 35 },
  { id: "company", title: "Company", year: 1970, description: "Sondheim's concept musical on marriage. 6 Tonys original; 5 Tonys 2021 gender-swapped revival.", imageUrl: null, popularityRank: 36 },
  { id: "evita", title: "Evita", year: 1978, description: "Lloyd Webber & Rice's sung-through biography of Eva Perón. 7 Tony wins; Madonna film.", imageUrl: null, popularityRank: 37 },
  { id: "jesus-christ-superstar", title: "Jesus Christ Superstar", year: 1971, description: "Lloyd Webber & Rice's rock-opera retelling of Holy Week.", imageUrl: null, popularityRank: 38 },
  { id: "spring-awakening", title: "Spring Awakening", year: 2006, description: "Duncan Sheik's indie-rock score on repressed 19th-century teens. 8 Tony wins.", imageUrl: null, popularityRank: 39 },
  { id: "next-to-normal", title: "Next to Normal", year: 2008, description: "Yorkey & Kitt's rock musical on bipolar disorder. 3 Tony wins, Pulitzer.", imageUrl: null, popularityRank: 40 },
  { id: "kinky-boots", title: "Kinky Boots", year: 2012, description: "Cyndi Lauper's score about a shoe factory saved by drag boots. 6 Tony wins.", imageUrl: null, popularityRank: 41 },
  { id: "a-strange-loop", title: "A Strange Loop", year: 2019, description: "Michael R. Jackson's metafictional piece on a Black gay writer writing a musical about a Black gay writer. 2 Tony wins incl. Best Musical 2022, Pulitzer.", imageUrl: null, popularityRank: 42 },
  { id: "the-producers", title: "The Producers", year: 2001, description: "Mel Brooks's musicalization of his own film. Record 12 Tony wins.", imageUrl: null, popularityRank: 43 },
  { id: "little-shop-of-horrors", title: "Little Shop of Horrors", year: 1982, description: "Menken & Ashman's doo-wop horror comedy about a man-eating plant.", imageUrl: null, popularityRank: 44 },
  { id: "a-chorus-line", title: "A Chorus Line", year: 1975, description: "Michael Bennett's audition portrait of Broadway dancers. 9 Tony wins, Pulitzer.", imageUrl: null, popularityRank: 45 },
  { id: "annie", title: "Annie", year: 1977, description: "The orphan with a red dress finds Daddy Warbucks. 7 Tony wins.", imageUrl: null, popularityRank: 46 },
  { id: "sunday-in-the-park-with-george", title: "Sunday in the Park with George", year: 1984, description: "Sondheim & Lapine on Seurat, art, and creation. Pulitzer winner.", imageUrl: null, popularityRank: 47 },
  { id: "tick-tick-boom", title: "Tick, Tick... Boom!", year: 2001, description: "Jonathan Larson's autobiographical piece. 2021 Netflix film with Andrew Garfield.", imageUrl: null, popularityRank: 48 },
  { id: "jersey-boys", title: "Jersey Boys", year: 2005, description: "The story of Frankie Valli and the Four Seasons. 4 Tony wins; Clint Eastwood film.", imageUrl: null, popularityRank: 49 },
  { id: "funny-girl", title: "Funny Girl", year: 1964, description: "Jule Styne's Fanny Brice biography. Streisand film; Lea Michele 2022 revival.", imageUrl: null, popularityRank: 50 },
  { id: "the-music-man", title: "The Music Man", year: 1957, description: "Meredith Willson's con-man bandleader. 5 Tony wins; Hugh Jackman / Sutton Foster 2022 revival.", imageUrl: null, popularityRank: 51 },
  { id: "hello-dolly", title: "Hello, Dolly!", year: 1964, description: "Jerry Herman's matchmaker comedy. 10 Tony wins; Bette Midler 2017 revival.", imageUrl: null, popularityRank: 52 },
  { id: "kimberly-akimbo", title: "Kimberly Akimbo", year: 2022, description: "Tesori & Lindsay-Abaire's coming-of-age story. 5 Tony wins incl. Best Musical 2023.", imageUrl: null, popularityRank: 53 },
  { id: "pippin", title: "Pippin", year: 1972, description: "Stephen Schwartz's metatheatrical coming-of-age fable. 2013 revival Tony sweep.", imageUrl: null, popularityRank: 54 },
  { id: "avenue-q", title: "Avenue Q", year: 2003, description: "Adult puppets on a Sesame Street stand-in. 3 Tony wins incl. Best Musical (upset over Wicked).", imageUrl: null, popularityRank: 55 },
  { id: "gypsy", title: "Gypsy", year: 1959, description: "Sondheim, Styne & Laurents on Mama Rose and the birth of burlesque. Audra McDonald 2024 revival.", imageUrl: null, popularityRank: 56 },
  { id: "oklahoma", title: "Oklahoma!", year: 1943, description: "Rodgers & Hammerstein's genre-defining frontier romance. Daniel Fish 2019 revival won Best Revival.", imageUrl: null, popularityRank: 57 },
  { id: "fun-home", title: "Fun Home", year: 2013, description: "Tesori & Kron's adaptation of Alison Bechdel's graphic memoir. 5 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 58 },
  { id: "billy-elliot", title: "Billy Elliot the Musical", year: 2005, description: "Elton John's adaptation of the film about a miner's son who dances. 10 Tony wins.", imageUrl: null, popularityRank: 59 },
  { id: "once", title: "Once", year: 2011, description: "Folk-pop musical based on the John Carney film. 8 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 60 },
  { id: "some-like-it-hot", title: "Some Like It Hot", year: 2022, description: "Shaiman & Wittman's adaptation of the Billy Wilder film. 4 Tony wins.", imageUrl: null, popularityRank: 61 },
  { id: "ragtime", title: "Ragtime", year: 1998, description: "Flaherty & Ahrens's epic adaptation of the E.L. Doctorow novel. 4 Tony wins.", imageUrl: null, popularityRank: 62 },
  { id: "guys-and-dolls", title: "Guys and Dolls", year: 1950, description: "Frank Loesser's Damon Runyon gamblers and mission dolls. 5 Tony wins.", imageUrl: null, popularityRank: 63 },
  { id: "an-american-in-paris", title: "An American in Paris", year: 2015, description: "Christopher Wheeldon's Gershwin-scored ballet-musical from the MGM film. 4 Tony wins.", imageUrl: null, popularityRank: 64 },
  { id: "a-gentlemans-guide-to-love-and-murder", title: "A Gentleman's Guide to Love and Murder", year: 2013, description: "Edwardian dark comedy where one actor plays all eight murder victims. 4 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 65 },
  { id: "kiss-of-the-spider-woman", title: "Kiss of the Spider Woman", year: 1992, description: "Kander & Ebb's adaptation of the Manuel Puig novel. 7 Tony wins incl. Best Musical; Chita Rivera Best Actress.", imageUrl: null, popularityRank: 66 },
  { id: "the-drowsy-chaperone", title: "The Drowsy Chaperone", year: 2006, description: "A man in a chair narrates his favorite fictional 1920s musical. 5 Tony wins.", imageUrl: null, popularityRank: 67 },
  { id: "spamalot", title: "Spamalot", year: 2005, description: "Eric Idle's Monty Python and the Holy Grail adaptation. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 68 },
  { id: "memphis", title: "Memphis", year: 2009, description: "Bon Jovi keyboardist David Bryan's 1950s R&B radio musical. 4 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 69 },
  { id: "thoroughly-modern-millie", title: "Thoroughly Modern Millie", year: 2002, description: "Sutton Foster's breakout role; flapper comedy. 6 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 70 },
  { id: "the-light-in-the-piazza", title: "The Light in the Piazza", year: 2005, description: "Adam Guettel's lush chamber romance set in 1950s Florence. 6 Tony wins.", imageUrl: null, popularityRank: 71 },
  { id: "the-whos-tommy", title: "The Who's Tommy", year: 1993, description: "Pete Townshend & Des McAnuff's stage adaptation of The Who's rock opera. 5 Tony wins.", imageUrl: null, popularityRank: 72 },
  { id: "titanic", title: "Titanic", year: 1997, description: "Maury Yeston's sung-through tragedy. 5 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 73 },
  { id: "aida", title: "Aida", year: 2000, description: "Elton John & Tim Rice's retelling of the Verdi opera. 4 Tony wins.", imageUrl: null, popularityRank: 74 },
  { id: "dreamgirls", title: "Dreamgirls", year: 1981, description: "Henry Krieger's Motown-inspired girl-group rise. 6 Tony wins; Jennifer Hudson film.", imageUrl: null, popularityRank: 75 },
  { id: "la-cage-aux-folles", title: "La Cage aux Folles", year: 1983, description: "Jerry Herman's drag-nightclub comedy. 6 Tony wins; first show to win Best Musical plus both Best Revivals.", imageUrl: null, popularityRank: 76 },
  { id: "a-little-night-music", title: "A Little Night Music", year: 1973, description: "Sondheim's waltz-based romantic comedy; home of 'Send in the Clowns.' 6 Tony wins.", imageUrl: null, popularityRank: 77 },
  { id: "urinetown", title: "Urinetown", year: 2001, description: "Hollmann & Kotis's absurdist satire where paying to pee is the law. 3 Tony wins.", imageUrl: null, popularityRank: 78 },
  { id: "follies", title: "Follies", year: 1971, description: "Sondheim's reunion of aging Ziegfeld-style showgirls. 7 Tony wins.", imageUrl: null, popularityRank: 79 },
  { id: "the-wiz", title: "The Wiz", year: 1975, description: "All-Black R&B retelling of The Wizard of Oz. 7 Tony wins; Diana Ross film.", imageUrl: null, popularityRank: 80 },
  { id: "passion", title: "Passion", year: 1994, description: "Sondheim & Lapine's obsessive romance in 19th-century Italy. 4 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 81 },
  { id: "man-of-la-mancha", title: "Man of La Mancha", year: 1965, description: "Dale Wasserman & Mitch Leigh on Cervantes and Don Quixote. 5 Tony wins.", imageUrl: null, popularityRank: 82 },
  { id: "the-king-and-i", title: "The King and I", year: 1951, description: "Rodgers & Hammerstein's Siamese court romance. 5 Tony wins; 2015 revival also swept.", imageUrl: null, popularityRank: 83 },
  { id: "south-pacific", title: "South Pacific", year: 1949, description: "Rodgers & Hammerstein's WWII Pacific romance. 10 Tony wins, Pulitzer.", imageUrl: null, popularityRank: 84 },
  { id: "kiss-me-kate", title: "Kiss Me, Kate", year: 1948, description: "Cole Porter's backstage Taming of the Shrew. 5 Tony wins — the first-ever Best Musical.", imageUrl: null, popularityRank: 85 },
  { id: "how-to-succeed-in-business", title: "How to Succeed in Business Without Really Trying", year: 1961, description: "Frank Loesser's corporate-ladder satire. 7 Tony wins, Pulitzer; Daniel Radcliffe 2011 revival.", imageUrl: null, popularityRank: 86 },
  { id: "damn-yankees", title: "Damn Yankees", year: 1955, description: "Adler & Ross's Faustian baseball comedy. 7 Tony wins.", imageUrl: null, popularityRank: 87 },
  { id: "bye-bye-birdie", title: "Bye Bye Birdie", year: 1960, description: "Strouse & Adams's Elvis-goes-to-the-army comedy. 4 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 88 },
  { id: "1776", title: "1776", year: 1969, description: "Sherman Edwards's musical on drafting the Declaration of Independence. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 89 },
  { id: "nine", title: "Nine", year: 1982, description: "Maury Yeston's musical adaptation of Fellini's 8½. 5 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 90 },
  { id: "fosse", title: "Fosse", year: 1999, description: "Revue of Bob Fosse's choreography. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 91 },
  { id: "grey-gardens", title: "Grey Gardens", year: 2006, description: "Frankel & Korie's musical of the Maysles documentary about the Beales of East Hampton. 3 Tony wins.", imageUrl: null, popularityRank: 92 },
  { id: "fela", title: "Fela!", year: 2009, description: "Bill T. Jones's biographical musical of Afrobeat pioneer Fela Kuti. 3 Tony wins.", imageUrl: null, popularityRank: 93 },
  { id: "city-of-angels", title: "City of Angels", year: 1989, description: "Cy Coleman & David Zippel's noir pastiche about a screenwriter and his creation. 6 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 94 },
  { id: "big-river", title: "Big River", year: 1985, description: "Roger Miller's country-folk adaptation of Huckleberry Finn. 7 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 95 },
  { id: "crazy-for-you", title: "Crazy for You", year: 1992, description: "Gershwin jukebox musical built on Girl Crazy. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 96 },
  { id: "a-funny-thing-happened-on-the-way-to-the-forum", title: "A Funny Thing Happened on the Way to the Forum", year: 1962, description: "Sondheim's first solo-score Broadway show, a Roman farce. 5 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 97 },
  { id: "the-secret-garden", title: "The Secret Garden", year: 1991, description: "Lucy Simon & Marsha Norman's adaptation of the Frances Hodgson Burnett novel. 3 Tony wins.", imageUrl: null, popularityRank: 98 },
  { id: "contact", title: "Contact", year: 2000, description: "Susan Stroman's dance-theatre triptych. 4 Tony wins incl. (controversially) Best Musical.", imageUrl: null, popularityRank: 99 },
  { id: "the-mystery-of-edwin-drood", title: "The Mystery of Edwin Drood", year: 1985, description: "Rupert Holmes's Dickens-adapted whodunit where the audience picks the ending. 5 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 100 },
  { id: "grand-hotel", title: "Grand Hotel", year: 1989, description: "Tommy Tune's Berlin-set ensemble piece from the Vicki Baum novel. 5 Tony wins.", imageUrl: null, popularityRank: 101 },
  { id: "the-will-rogers-follies", title: "The Will Rogers Follies", year: 1991, description: "Cy Coleman revue framing Will Rogers as a Ziegfeld Follies star. 6 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 102 },
  { id: "wonderful-town", title: "Wonderful Town", year: 1953, description: "Leonard Bernstein's score about two Ohio sisters in Greenwich Village. 5 Tony wins.", imageUrl: null, popularityRank: 103 },
  { id: "aint-misbehavin", title: "Ain't Misbehavin'", year: 1978, description: "Revue of Fats Waller songs. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 104 },
  { id: "on-the-twentieth-century", title: "On the Twentieth Century", year: 1978, description: "Cy Coleman & Comden/Green's operetta set on the Chicago-to-NYC train. 5 Tony wins.", imageUrl: null, popularityRank: 105 },
  { id: "jerome-robbins-broadway", title: "Jerome Robbins' Broadway", year: 1989, description: "Retrospective revue of Jerome Robbins's choreography from his Broadway career. 6 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 106 },
  { id: "applause", title: "Applause", year: 1970, description: "Musical adaptation of All About Eve starring Lauren Bacall. 4 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 107 },
  { id: "mame", title: "Mame", year: 1966, description: "Jerry Herman's adaptation of Auntie Mame, launching Angela Lansbury's musical stardom. 3 Tony wins.", imageUrl: null, popularityRank: 108 },
  { id: "me-and-my-girl", title: "Me and My Girl", year: 1986, description: "1937 British musical revived on Broadway with Robert Lindsay. 3 Tony wins.", imageUrl: null, popularityRank: 109 },
  { id: "bring-in-da-noise-bring-in-da-funk", title: "Bring in 'da Noise, Bring in 'da Funk", year: 1996, description: "Savion Glover & George C. Wolfe's tap history of Black America. 4 Tony wins.", imageUrl: null, popularityRank: 110 },
  { id: "the-pajama-game", title: "The Pajama Game", year: 1954, description: "Adler & Ross's labor-dispute romance in a pajama factory. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 111 },
  { id: "kismet", title: "Kismet", year: 1953, description: "Arabian Nights musical built on Borodin melodies. 3 Tony wins incl. Best Musical.", imageUrl: null, popularityRank: 112 },
  { id: "jellys-last-jam", title: "Jelly's Last Jam", year: 1992, description: "George C. Wolfe's biographical musical of Jelly Roll Morton. 3 Tony wins.", imageUrl: null, popularityRank: 113 },
];

/**
 * Return the top `n` musicals by curated rank. Pure function — no DB.
 * Pass `n` larger than the list to get the whole list.
 */
export function getTopMusicals(n: number): TopMusical[] {
  if (n <= 0) return [];
  return TOP_MUSICALS.slice(0, n);
}
