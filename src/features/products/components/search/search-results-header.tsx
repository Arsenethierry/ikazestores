
export const SearchResultsHeader = ({ query }: { query: string }) => {
    if (!query) {
        return null;
    }

    return (
        <div className="mb-6">
            <h1 className="text-2xl font-medium">
                Search results for &quot;<span className="text-blue-600">{query}</span>&quot;
            </h1>
            <p className="text-gray-500 mt-1">
                Use the filters on the left to refine these results
            </p>
        </div>
    );
}