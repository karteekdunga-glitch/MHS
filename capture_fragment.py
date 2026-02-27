from pathlib import Path
path=Path('client/src/pages/StudentLife.tsx')
text=path.read_text()
start=text.index('                    <CardHeader className=')
end=text.index('                    </CardContent>', start)
end=text.index('</Card>', end)  # include closing content? hmm
fragment=text[start:text.index('                    </CardContent>', start)+len('                    </CardContent>\n                    <MediaCarousel images={story.images} />\n                    <p className="text-slate-600 leading-relaxed">{story.description}</p>\n                    </CardContent>')]
print(fragment)
