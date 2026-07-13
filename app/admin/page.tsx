  useEffect(() => {
    if (!isAuthenticated) return;
    
    // FIX: Removed 'orderBy' from the query to prevent silent indexing failures.
    // We fetch everything and sort it in memory instead.
    const unsubInv = onSnapshot(collection(db, "inventory"), (snapshot) => { 
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      fetchedProducts.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setProducts(fetchedProducts); 
      setLoading(false); 
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => { 
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setOrders(fetchedOrders); 
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) setSystemSettings({ ...initialSettingsState, ...docSnap.data() });
    });
    
    return () => { unsubInv(); unsubOrders(); unsubSettings(); };
  }, [isAuthenticated]);
