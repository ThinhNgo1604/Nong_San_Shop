function DashboardFilter({

    from,

    to,

    onFromChange,

    onToChange,

    onSearch

}){

    return(

        <div className="card mb-4">

            <div className="card-body">

                <div className="row">

                    <div className="col-md-4">

                        <label>Từ ngày</label>

                        <input
                            type="date"
                            className="form-control"
                            value={from}
                            onChange={(e)=>onFromChange(e.target.value)}
                        />

                    </div>

                    <div className="col-md-4">

                        <label>Đến ngày</label>

                        <input
                            type="date"
                            className="form-control"
                            value={to}
                            onChange={(e)=>onToChange(e.target.value)}
                        />

                    </div>

                    <div className="col-md-4 d-flex align-items-end">

                        <button
                            className="btn btn-success w-100"
                            onClick={onSearch}
                        >
                            Thống kê
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default DashboardFilter;