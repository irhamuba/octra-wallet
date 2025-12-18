/**
 * Address Book - Save frequently used addresses
 * Max 3 addresses
 */

const ADDRESS_BOOK_KEY = 'address_book';
const MAX_ADDRESSES = 3;

export const getAddressBook = () => {
    try {
        const stored = localStorage.getItem(ADDRESS_BOOK_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveAddressBook = (addresses) => {
    localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addresses.slice(0, MAX_ADDRESSES)));
};

export const addAddress = (address, label) => {
    const book = getAddressBook();

    // Check if already exists
    const existingIndex = book.findIndex(a => a.address === address);
    if (existingIndex !== -1) {
        // Update label
        book[existingIndex].label = label;
        saveAddressBook(book);
        return { success: true, book };
    }

    // Check max limit
    if (book.length >= MAX_ADDRESSES) {
        return { success: false, error: `Maximum ${MAX_ADDRESSES} addresses allowed` };
    }

    book.push({
        address,
        label,
        createdAt: Date.now()
    });

    saveAddressBook(book);
    return { success: true, book };
};

export const removeAddress = (address) => {
    const book = getAddressBook().filter(a => a.address !== address);
    saveAddressBook(book);
    return book;
};

export const updateAddressLabel = (address, newLabel) => {
    const book = getAddressBook();
    const idx = book.findIndex(a => a.address === address);
    if (idx !== -1) {
        book[idx].label = newLabel;
        saveAddressBook(book);
    }
    return book;
};
