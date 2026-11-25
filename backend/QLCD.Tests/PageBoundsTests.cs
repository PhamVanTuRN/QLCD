using QLCD.Application.Common;

namespace QLCD.Tests;

public class PageBoundsTests
{
    [Fact]
    public void PaginationRejectsLimitsAndNormalizesSearch()
    {
        Assert.Equal(0, PageBounds.Offset(1, 1));
        Assert.Equal(1_999_800, PageBounds.Offset(10_000, 200));
        Assert.Throws<ArgumentException>(() => PageBounds.Offset(0, 50));
        Assert.Throws<ArgumentException>(() => PageBounds.Offset(1, 201));
        Assert.Null(PageBounds.Search(" "));
        Assert.Equal("fixture01", PageBounds.Search("  FIXTURE01  "));
        Assert.Throws<ArgumentException>(() => PageBounds.Search(new string('x', 101)));
    }
}
