interface EmbedField {
  name: string
  value: string
  inline: boolean
}

interface EmbedData {
  title: string
  description: string
  color: string
  url: string
  thumbnail: string
  image: string
  footer: string
  footerIcon: string
  author: string
  authorIcon: string
  authorUrl: string
  fields: EmbedField[]
  timestamp: boolean
}

interface MessageData {
  content: string
  username: string
  avatarUrl: string
  tts: boolean
}

interface EmbedPreviewProps {
  embedData: EmbedData
  messageData: MessageData
}

export function EmbedPreview({ embedData, messageData }: EmbedPreviewProps) {
  const hasEmbedContent =
    embedData.title ||
    embedData.description ||
    embedData.author ||
    embedData.fields.length > 0 ||
    embedData.image ||
    embedData.footer

  const hasMessageContent = messageData.content

  if (!hasEmbedContent && !hasMessageContent) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-sm">Your message preview will appear here as you build it</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 font-sans">
      {/* Message Header */}
      <div className="flex items-start gap-3 mb-2">
        <img
          src={messageData.avatarUrl || "/placeholder.svg?height=40&width=40&query=discord+bot+avatar"}
          alt="Bot Avatar"
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=40&width=40"
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium">{messageData.username || "Discord Bot"}</span>
            <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded">BOT</span>
            <span className="text-gray-400 text-xs">
              Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Regular Message Content */}
          {hasMessageContent && (
            <div className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">
              {messageData.content}
              {messageData.tts && (
                <span className="ml-2 text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">TTS</span>
              )}
            </div>
          )}

          {/* Embed */}
          {hasEmbedContent && (
            <div className="bg-gray-700 rounded p-4 relative max-w-lg">
              {/* Color bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                style={{ backgroundColor: embedData.color }}
              />

              <div className="ml-3">
                {/* Author */}
                {embedData.author && (
                  <div className="flex items-center mb-2">
                    {embedData.authorIcon && (
                      <img
                        src={embedData.authorIcon || "/placeholder.svg"}
                        alt="Author"
                        className="w-6 h-6 rounded-full mr-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    )}
                    <span className="text-white text-sm font-medium">
                      {embedData.authorUrl ? (
                        <a href={embedData.authorUrl} className="text-blue-400 hover:underline">
                          {embedData.author}
                        </a>
                      ) : (
                        embedData.author
                      )}
                    </span>
                  </div>
                )}

                {/* Title */}
                {embedData.title && (
                  <div className="mb-2">
                    {embedData.url ? (
                      <a href={embedData.url} className="text-blue-400 hover:underline text-lg font-semibold">
                        {embedData.title}
                      </a>
                    ) : (
                      <h3 className="text-white text-lg font-semibold">{embedData.title}</h3>
                    )}
                  </div>
                )}

                {/* Description */}
                {embedData.description && (
                  <div className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">{embedData.description}</div>
                )}

                {/* Fields */}
                {embedData.fields.length > 0 && (
                  <div className="mb-3">
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: embedData.fields.some((f) => f.inline)
                          ? "repeat(auto-fit, minmax(150px, 1fr))"
                          : "1fr",
                      }}
                    >
                      {embedData.fields.map((field, index) => (
                        <div key={index} className={field.inline ? "" : "col-span-full"}>
                          <div className="text-white text-sm font-semibold mb-1">{field.name}</div>
                          <div className="text-gray-300 text-sm whitespace-pre-wrap">{field.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Large Image */}
                {embedData.image && (
                  <div className="mb-3">
                    <img
                      src={embedData.image || "/placeholder.svg"}
                      alt="Embed"
                      className="rounded max-w-full h-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                )}

                {/* Thumbnail */}
                {embedData.thumbnail && (
                  <div className="float-right ml-4 mb-2">
                    <img
                      src={embedData.thumbnail || "/placeholder.svg"}
                      alt="Thumbnail"
                      className="w-20 h-20 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                )}

                {/* Footer */}
                {(embedData.footer || embedData.timestamp) && (
                  <div className="flex items-center mt-3 pt-2 border-t border-gray-600">
                    {embedData.footerIcon && (
                      <img
                        src={embedData.footerIcon || "/placeholder.svg"}
                        alt="Footer"
                        className="w-5 h-5 rounded-full mr-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    )}
                    {embedData.footer && <span className="text-gray-400 text-xs">{embedData.footer}</span>}
                    {embedData.footer && embedData.timestamp && <span className="text-gray-400 text-xs mx-1">•</span>}
                    {embedData.timestamp && (
                      <span className="text-gray-400 text-xs">{new Date().toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
