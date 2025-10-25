class StreamManager {
  constructor() {
    this.streams = new Map();
  }

  get(gameId) {
    if (!this.streams.has(gameId)) {
      this.streams.set(gameId, new Set());
    }
    return this.streams.get(gameId);
  }

  broadcast(gameId, payload) {
    const targets = this.get(gameId);
    const message = `data: ${JSON.stringify(payload)}\n\n`;
    targets.forEach((res) => {
      try {
        res.write(message);
      } catch (error) {
        targets.delete(res);
      }
    });
  }
}

module.exports = new StreamManager();
