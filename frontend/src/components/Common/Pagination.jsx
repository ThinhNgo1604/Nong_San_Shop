function Pagination({
    page,
    totalPages,
    onPageChange
}) {

    if (totalPages <= 1) return null;

    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (

        <nav className="mt-4">

            <ul className="pagination justify-content-center">

                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>

                    <button
                        className="page-link"
                        onClick={() => onPageChange(1)}
                    >
                        &laquo;
                    </button>

                </li>

                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>

                    <button
                        className="page-link"
                        onClick={() => onPageChange(page - 1)}
                    >
                        &lsaquo;
                    </button>

                </li>

                {

                    pages.map(p => (

                        <li
                            key={p}
                            className={`page-item ${page === p ? "active" : ""}`}
                        >

                            <button
                                className="page-link"
                                onClick={() => onPageChange(p)}
                            >
                                {p}
                            </button>

                        </li>

                    ))

                }

                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>

                    <button
                        className="page-link"
                        onClick={() => onPageChange(page + 1)}
                    >
                        &rsaquo;
                    </button>

                </li>

                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>

                    <button
                        className="page-link"
                        onClick={() => onPageChange(totalPages)}
                    >
                        &raquo;
                    </button>

                </li>

            </ul>

        </nav>

    );

}

export default Pagination;