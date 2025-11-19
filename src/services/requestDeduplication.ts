class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private enabled = true;

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return requestFn();
    }

    if (this.pendingRequests.has(key)) {
      console.log(`🔄 [Dedup] Reusing pending request for key: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    console.log(`🆕 [Dedup] Creating new request for key: ${key}`);
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.clear();
  }

  getStats(): { pending: number; enabled: boolean } {
    return {
      pending: this.pendingRequests.size,
      enabled: this.enabled
    };
  }
}

export const requestDeduplicator = new RequestDeduplicator();
