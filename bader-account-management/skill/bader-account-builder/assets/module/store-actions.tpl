      add__Type__: (item) => {
        const rec = { ...item, isFavorite: item.isFavorite ?? false, id: generateId(), createdAt: now(), updatedAt: now() } as __Type__;
        set({ __kind__: [...get().__kind__, rec] });
        get().logActivity("add", "__kind__", String(rec.__TITLE__));
      },
      update__Type__: (id, updates) => {
        const old = get().__kind__.find((x) => x.id === id);
        set({ __kind__: get().__kind__.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: now() } : x)) });
        if (old) get().logActivity("edit", "__kind__", String(updates.__TITLE__ ?? old.__TITLE__));
      },
      delete__Type__: (id) => {
        const old = get().__kind__.find((x) => x.id === id);
        set({ __kind__: get().__kind__.filter((x) => x.id !== id) });
        if (old) get().logActivity("delete", "__kind__", String(old.__TITLE__));
      },
      toggleFavorite__Type__: (id) =>
        set({ __kind__: get().__kind__.map((x) => (x.id === id ? { ...x, isFavorite: !x.isFavorite } : x)) }),
